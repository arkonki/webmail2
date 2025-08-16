import express from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config();

const app: express.Express = express();
const port = 3001;

// Use a general CORS configuration for development to allow all origins.
// This is more robust for local testing than a specific origin.
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const client = new ImapFlow({
        host: 'mail.veebimajutus.ee',
        port: 993,
        secure: true,
        auth: {
            user: email,
            pass: password,
        },
        logger: false // Set to true for detailed logging
    });

    try {
        await client.connect();
        // If connect succeeds, authentication was successful.
        await client.logout();
        res.json({ success: true, message: 'Authentication successful.' });
    } catch (err: any) {
        console.error('IMAP login failed:', err.message);
        // Avoid leaking detailed server errors to the client.
        res.status(401).json({ success: false, message: 'Invalid credentials or connection issue.' });
    }
});

app.post('/api/sync', async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const client = new ImapFlow({
        host: 'mail.veebimajutus.ee',
        port: 993,
        secure: true,
        auth: {
            user: email,
            pass: password,
        },
        logger: false,
    });

    const emails = [];

    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            if (client.mailbox && client.mailbox.exists) {
                const fetchFrom = Math.max(1, client.mailbox.exists - 49);
                for await (let msg of client.fetch(`${fetchFrom}:*`, { uid: true, flags: true, source: true, envelope: true })) {
                    const parsed = await simpleParser(msg.source);

                    const normalizedSubject = (parsed.subject || '')
                        .replace(/^(Re|Fwd|Fw):\s*/i, '')
                        .trim();

                    const labelIds = [];
                    if (msg.flags.has('\\Flagged')) {
                        labelIds.push('Starred');
                    }
                    
                    const sender = parsed.from?.value[0] || { address: 'unknown', name: 'Unknown' };

                    emails.push({
                        id: msg.uid.toString(),
                        conversationId: normalizedSubject || `conv-${parsed.messageId}`,
                        senderName: sender.name || sender.address?.split('@')[0],
                        senderEmail: sender.address,
                        recipientEmail: parsed.to?.value[0]?.address || email,
                        subject: parsed.subject || '(no subject)',
                        body: parsed.html || parsed.textAsHtml || '', // Prefer HTML body
                        snippet: (parsed.text || '').substring(0, 120).replace(/\s+/g, ' ').trim(),
                        timestamp: parsed.date?.toISOString(),
                        isRead: msg.flags.has('\\Seen'),
                        folderId: 'Inbox',
                        labelIds: labelIds,
                        attachments: (parsed.attachments || []).map(att => ({
                            fileName: att.filename,
                            fileSize: att.size,
                            mimeType: att.contentType,
                            url: `data:${att.contentType};base64,${att.content.toString('base64')}`
                        })),
                        messageId: parsed.messageId,
                    });
                }
            }
        } finally {
            lock.release();
        }
        await client.logout();
        res.json({ success: true, emails: emails.reverse() });
    } catch (err: any) {
        console.error('IMAP sync failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to sync emails.' });
    }
});


app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
