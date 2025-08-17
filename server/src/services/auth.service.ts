import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
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

export class AuthService {
    public static async login(data: LoginData) {
        // 1. Verify credentials against mail servers
        await ImapService.verifyCredentials(data.email, data.password, data.imapHost, data.imapPort);
        await SmtpService.verifyCredentials(data.email, data.password, data.smtpHost, data.smtpPort);

        // 2. Encrypt password for storage
        const { encrypted: encryptedPassword, iv } = CryptoService.encrypt(data.password);
        const name = data.email.split('@')[0];

        // 3. Find or create user and account in DB
        const user = await prisma.user.upsert({
            where: { email: data.email },
            update: {},
            create: { email: data.email, name },
        });

        await prisma.account.upsert({
            where: { email: data.email },
            update: { encryptedPassword, iv, imapHost: data.imapHost, imapPort: data.imapPort, smtpHost: data.smtpHost, smtpPort: data.smtpPort },
            create: { userId: user.id, email: data.email, encryptedPassword, iv, imapHost: data.imapHost, imapPort: data.imapPort, smtpHost: data.smtpHost, smtpPort: data.smtpPort },
        });

        // 4. Create and return JWT
        const token = jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, {
            expiresIn: '7d',
        });

        return { token, user: { id: user.id, email: user.email, name: user.name } };
    }
}
