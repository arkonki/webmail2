import jwt from 'jsonwebtoken';
import db from '../lib/db.js';
import { CryptoService } from './crypto.service.js';
import { ImapService } from './imap.service.js';
import { SmtpService } from './smtp.service.js';
import config from '../config.js';
import { SystemFolder } from '../../../types.js';

interface LoginData {
    email: string;
    password: string;
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
}

interface User {
    id: string;
    email: string;
    name: string;
}

const createDefaultFolders = async (client: any, accountId: string) => {
    const defaultFolders = Object.values(SystemFolder);
    const query = 'INSERT INTO "Folder" ("accountId", path, name, "specialUse", delimiter) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (path, "accountId") DO NOTHING';
    for (const folderName of defaultFolders) {
        // SpecialUse attribute often matches the folder name in uppercase for standard folders.
        const specialUse = `\\${folderName}`;
        await client.query(query, [accountId, folderName, folderName, specialUse, '/']);
    }
};

export class AuthService {
    public static async login(data: LoginData) {
        // 1. Verify credentials against mail servers
        await ImapService.verifyCredentials(data.email, data.password, data.imapHost, data.imapPort);
        await SmtpService.verifyCredentials(data.email, data.password, data.smtpHost, data.smtpPort);

        // 2. Encrypt password for storage
        const { encrypted: encryptedPassword, iv } = CryptoService.encrypt(data.password);
        const name = data.email.split('@')[0];

        // 3. Find or create user and account in DB
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            let isNewUser = false;

            // Find or create user
            let userResult = await client.query('SELECT * FROM "User" WHERE email = $1', [data.email]);
            let user: User;

            if (userResult.rows.length === 0) {
                isNewUser = true;
                const insertUserQuery = 'INSERT INTO "User" (email, name) VALUES ($1, $2) RETURNING *';
                userResult = await client.query(insertUserQuery, [data.email, name]);
                user = userResult.rows[0];
            } else {
                user = userResult.rows[0];
            }
            
            // Upsert account
            const upsertAccountQuery = `
                INSERT INTO "Account" ("userId", email, "encryptedPassword", iv, "imapHost", "imapPort", "smtpHost", "smtpPort")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (email)
                DO UPDATE SET
                    "encryptedPassword" = EXCLUDED."encryptedPassword",
                    iv = EXCLUDED.iv,
                    "imapHost" = EXCLUDED."imapHost",
                    "imapPort" = EXCLUDED."imapPort",
                    "smtpHost" = EXCLUDED."smtpHost",
                    "smtpPort" = EXCLUDED."smtpPort",
                    "updatedAt" = CURRENT_TIMESTAMP
                RETURNING id;
            `;
            const accountResult = await client.query(upsertAccountQuery, [user.id, data.email, encryptedPassword, iv, data.imapHost, data.imapPort, data.smtpHost, data.smtpPort]);
            const accountId = accountResult.rows[0].id;

            // If it's a new user, create their default folders
            if (isNewUser) {
                await createDefaultFolders(client, accountId);
            }

            await client.query('COMMIT');
            
            // 4. Create and return JWT
            const token = jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, {
                expiresIn: '7d',
            });

            return { token, user: { id: user.id, email: user.email, name: user.name } };

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}