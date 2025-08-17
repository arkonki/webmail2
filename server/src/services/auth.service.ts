import jwt from 'jsonwebtoken';
import db from '../lib/db';
import { CryptoService } from './crypto.service';
import { ImapService } from './imap.service';
import { SmtpService } from './smtp.service';
import config from '../config';

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

            // Find or create user
            let userResult = await client.query('SELECT * FROM "User" WHERE email = $1', [data.email]);
            let user: User;

            if (userResult.rows.length === 0) {
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
                    "updatedAt" = CURRENT_TIMESTAMP;
            `;
            await client.query(upsertAccountQuery, [user.id, data.email, encryptedPassword, iv, data.imapHost, data.imapPort, data.smtpHost, data.smtpPort]);

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
