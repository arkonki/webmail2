
import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { process } from 'process';

dotenv.config();

// Augment the Express Request type
declare global {
    namespace Express {
        interface Request {
            auth?: {
                email: string;
                password: string;
            };
        }
    }
}

// --- Security Configuration & Validation ---
if (!process.env.JWT_SECRET || !process.env.ENCRYPTION_KEY) {
    console.error('FATAL ERROR: JWT_SECRET and ENCRYPTION_KEY environment variables must be set.');
    process.exit(1);
}
if (process.env.ENCRYPTION_KEY.length !== 64) {
    console.error('FATAL ERROR: ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const ALGORITHM = 'aes-256-gcm';
// The encryption key must be 32 bytes for aes-256-gcm, which is 64 hex characters.
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;


// --- Crypto Helper Functions ---
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Prepend IV and AuthTag to the encrypted data for use in decryption
  return Buffer.concat([iv, authTag, encrypted]).toString('hex');
}

function decrypt(hex: string): string {
  const buffer = Buffer.from(hex, 'hex');
  const iv = buffer.slice(0, IV_LENGTH);
  const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}


const app: express.Application = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Authentication Middleware ---
const authMiddleware = (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization token is required.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string; encryptedPass: string };
        const password = decrypt(decoded.encryptedPass);
        req.auth = { email: decoded.email, password };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

// In-memory store for scheduled jobs. In a real production app, this should be a persistent store like Redis.
const scheduledJobs = new Map<string, NodeJS.Timeout>();

// --- API Endpoints ---

app.post('/api/login', async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const client = new ImapFlow({
        host: 'mail.veebimajutus.ee', port: 993, secure: true,
        auth: { user: email, pass: password },
        logger: false
    });

    try {
        await client.connect();
        await client.logout();

        const encryptedPass = encrypt(password);
        const token = jwt.sign({ email, encryptedPass }, JWT_SECRET, { expiresIn: '8h' });

        res.json({ success: true, message: 'Authentication successful.', token });
    } catch (err: any) {
        console.error('IMAP login failed:', err.message);
        res.status(401).json({ success: false, message: 'Invalid credentials or connection issue.' });
    }
});

app.post('/api/folders', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.auth!;
    const logPrefix = `[FOLDERS FOR ${email}]`;

    const client = new ImapFlow({
        host: 'mail.veebimajutus.ee', port: 993, secure: true,
        auth: { user: email, pass: password }, logger: false,
    });

    try {
        console.log(`${logPrefix} Connecting to list folders...`);
        await client.connect();
        let folders = await client.list();
        const requiredFolders = { '\\Sent': 'Sent', '\\Drafts': 'Drafts', '\\Junk': 'Spam', '\\Trash': 'Trash' };
        const existingSpecialUseFolders = new Set(folders.map(f => f.specialUse).filter(Boolean));

        for (const [specialUse, name] of Object.entries(requiredFolders)) {
            if (!existingSpecialUseFolders.has(specialUse)) {
                console.log(`${logPrefix} System folder for ${specialUse} (${name}) not found. Creating...`);
                try {
                    const folderExists = folders.some(f => f.path === name);
                    if (!folderExists) {
                         await client.mailboxCreate(name);
                    }
                } catch (createError: any) {
                    console.warn(`${logPrefix} Could not create folder ${name}. It may already exist. Error: ${createError.message}`);
                }
            }
        }
        
        folders = await client.list();
        await client.logout();
        const mailboxes = folders.map(folder => ({
            path: folder.path, name: folder.name,
            specialUse: folder.specialUse || undefined, delimiter: folder.delimiter,
        }));
        res.json({ success: true, mailboxes });
    } catch (err: any) {
        console.error(`${logPrefix} Failed to list/create folders:`, err);
        res.status(500).json({ success: false, message: 'Failed to manage mail folders.' });
    }
});

app.post('/api/sync', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.auth!;
    const logPrefix = `[SYNC FOR ${email}]`;
    const client = new ImapFlow({
        host: 'mail.veebimajutus.ee', port: 993, secure: true,
        auth: { user: email, pass: password }, logger: false,
    });
    const emails = [];
    try {
        console.log(`${logPrefix} Starting sync...`);
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            if (client.mailbox && client.mailbox.exists) {
                console.log(`${logPrefix} Mailbox exists. Found ${client.mailbox.exists} messages.`);
                const fetchFrom = Math.max(1, client.mailbox.exists - 49);
                for await (let msg of client.fetch(`${fetchFrom}:*`, { uid: true, flags: true, source: true, envelope: true })) {
                    try {
                        const parsed = await simpleParser(msg.source);
                        const normalizedSubject = (parsed.subject || '').replace(/^(Re|Fwd|Fw):\s*/i, '').trim();
                        const getAddress = (addressObject: any) => {
                            if (!addressObject?.value?.length) return { address: 'unknown@example.com', name: 'Unknown' };
                            const value = addressObject.value[0];
                            return { address: value.address || 'undisclosed-recipients@example.com', name: value.name || value.address?.split('@')[0] || 'Unknown' };
                        };
                        const sender = getAddress(parsed.from);
                        const recipient = getAddress(parsed.to);
                        emails.push({
                            id: msg.uid.toString(),
                            conversationId: normalizedSubject || `conv-${parsed.messageId || msg.uid}`,
                            senderName: sender.name, senderEmail: sender.address,
                            recipientEmail: recipient.address === 'undisclosed-recipients@example.com' ? email : recipient.address,
                            subject: parsed.subject || '(no subject)',
                            body: parsed.html || parsed.textAsHtml || parsed.text || '',
                            snippet: (parsed.text || '').substring(0, 120).replace(/\s+/g, ' ').trim(),
                            timestamp: (parsed.date || new Date()).toISOString(),
                            isRead: msg.flags.has('\\Seen'), folderId: 'INBOX',
                            labelIds: msg.flags.has('\\Flagged') ? ['Starred'] : [],
                            attachments: (parsed.attachments || []).map(att => ({
                                fileName: att.filename || 'untitled', fileSize: att.size || 0,
                                mimeType: att.contentType || 'application/octet-stream',
                                url: `data:${att.contentType || 'application/octet-stream'};base64,${att.content?.toString('base64') || ''}`
                            })),
                            messageId: parsed.messageId,
                        });
                    } catch (parseError: any) {
                        console.error(`${logPrefix} SKIPPING: Failed to parse message UID ${msg.uid}. Error:`, parseError.message);
                    }
                }
            }
        } finally { lock.release(); }
        await client.logout();
        res.json({ success: true, emails: emails.reverse() });
    } catch (err: any) {
        console.error(`${logPrefix} Full error:`, err);
        res.status(500).json({ success: false, message: 'Failed to sync emails due to a server error.' });
    }
});

// Note: test-connection remains unprotected as it's a developer tool for explicit password testing.
app.post('/api/test-connection', async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
    const client = new ImapFlow({ host: 'mail.veebimajutus.ee', port: 993, secure: true, auth: { user: email, pass: password }, logger: false });
    try {
        await client.connect();
        const mailbox = await client.mailboxOpen('INBOX');
        const messageCount = mailbox.exists;
        await client.logout();
        res.json({ success: true, message: `Connection successful! Found ${messageCount} messages in INBOX.` });
    } catch (err: any) {
        res.status(401).json({ success: false, message: `Connection failed: ${err.message}` });
    }
});

app.post('/api/send', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.auth!;
    const { from, to, cc, bcc, subject, body, attachments } = req.body;
    if (!to) return res.status(400).json({ success: false, message: 'Recipient is required.' });

    const transporter = nodemailer.createTransport({
        host: 'mail.veebimajutus.ee', port: 465, secure: true,
        auth: { user: email, pass: password },
    });
    const mailOptions = {
        from, to, cc, bcc, subject, html: body,
        attachments: (attachments || []).map((att: any) => ({
            filename: att.filename, content: att.content,
            encoding: 'base64', contentType: att.contentType,
        })),
    };
    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: `Failed to send email: ${error.message}` });
    }
});

app.post('/api/schedule-send', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.auth!;
    const { from, to, cc, bcc, subject, body, attachments, scheduleDate } = req.body;
    if (!to || !scheduleDate) return res.status(400).json({ success: false, message: 'Missing required fields for scheduling.' });

    const delay = new Date(scheduleDate).getTime() - Date.now();
    if (delay <= 0) return res.status(400).json({ success: false, message: 'Schedule date must be in the future.' });

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const transporter = nodemailer.createTransport({
        host: 'mail.veebimajutus.ee', port: 465, secure: true,
        auth: { user: email, pass: password },
    });
    const mailOptions = { from, to, cc, bcc, subject, html: body, attachments: (attachments || []).map((att: any) => ({
        filename: att.filename, content: att.content, encoding: 'base64', contentType: att.contentType,
    }))};

    const timeoutId = setTimeout(() => {
        transporter.sendMail(mailOptions)
            .then(() => console.log(`[SCHEDULE] Successfully sent job ${jobId}.`))
            .catch(error => console.error(`[SCHEDULE] Failed to send job ${jobId}:`, error))
            .finally(() => scheduledJobs.delete(jobId));
    }, delay);

    scheduledJobs.set(jobId, timeoutId);
    res.json({ success: true, message: 'Email scheduled successfully.', jobId });
});

app.post('/api/cancel-scheduled-send', authMiddleware, async (req: ExpressRequest, res: ExpressResponse) => {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'Job ID is required.' });
    const timeoutId = scheduledJobs.get(jobId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        scheduledJobs.delete(jobId);
        res.json({ success: true, message: 'Scheduled send cancelled.' });
    } else {
        res.status(404).json({ success: false, message: 'Scheduled job not found.' });
    }
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
