
import express, { Request, Response } from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config();

const app = express();
const port = 3001;

// Use a general CORS configuration for development to allow all origins.
// This is more robust for local testing than a specific origin.
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req: Request, res: Response) => {
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

app.post('/api/sync', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const logPrefix = `[SYNC FOR ${email}]`;

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
        console.log(`${logPrefix} Starting sync...`);
        await client.connect();
        console.log(`${logPrefix} IMAP client connected.`);
        const lock = await client.getMailboxLock('INBOX');
        console.log(`${logPrefix} Mailbox 'INBOX' locked.`);
        try {
            if (client.mailbox && client.mailbox.exists) {
                console.log(`${logPrefix} Mailbox exists. Found ${client.mailbox.exists} messages.`);
                const fetchFrom = Math.max(1, client.mailbox.exists - 49);
                console.log(`${logPrefix} Fetching messages from sequence ${fetchFrom} to *.`);
                
                let processedCount = 0;
                for await (let msg of client.fetch(`${fetchFrom}:*`, { uid: true, flags: true, source: true, envelope: true })) {
                    try {
                        const parsed = await simpleParser(msg.source);
                        processedCount++;
                        console.log(`${logPrefix} Processing message UID ${msg.uid}, Subject: ${parsed.subject}`);

                        const normalizedSubject = (parsed.subject || '')
                            .replace(/^(Re|Fwd|Fw):\s*/i, '')
                            .trim();

                        const labelIds = [];
                        if (msg.flags.has('\\Flagged')) {
                            labelIds.push('Starred');
                        }
                        
                        const getAddress = (addressObject: any) => {
                            if (!addressObject || !addressObject.value || addressObject.value.length === 0) {
                                return { address: 'unknown@example.com', name: 'Unknown' };
                            }
                            const value = addressObject.value[0];
                            return {
                                address: value.address || 'undisclosed-recipients@example.com',
                                name: value.name || (value.address ? value.address.split('@')[0] : 'Unknown')
                            };
                        };
                        
                        const sender = getAddress(parsed.from);
                        const recipient = getAddress(parsed.to);
                        // If recipient is undisclosed, fall back to the logged-in user's email
                        const recipientEmail = recipient.address === 'undisclosed-recipients@example.com' ? email : recipient.address;


                        emails.push({
                            id: msg.uid.toString(),
                            conversationId: normalizedSubject || `conv-${parsed.messageId || msg.uid}`,
                            senderName: sender.name,
                            senderEmail: sender.address,
                            recipientEmail: recipientEmail,
                            subject: parsed.subject || '(no subject)',
                            body: parsed.html || parsed.textAsHtml || parsed.text || '',
                            snippet: (parsed.text || '').substring(0, 120).replace(/\s+/g, ' ').trim(),
                            timestamp: (parsed.date || new Date()).toISOString(),
                            isRead: msg.flags.has('\\Seen'),
                            folderId: 'Inbox',
                            labelIds: labelIds,
                            attachments: (parsed.attachments || []).map(att => ({
                                fileName: att.filename || 'untitled',
                                fileSize: att.size || 0,
                                mimeType: att.contentType || 'application/octet-stream',
                                url: `data:${att.contentType || 'application/octet-stream'};base64,${att.content?.toString('base64') || ''}`
                            })),
                            messageId: parsed.messageId,
                        });
                    } catch (parseError: any) {
                        console.error(`${logPrefix} SKIPPING: Failed to parse message UID ${msg.uid}. Error:`, parseError.message);
                        // Continue to the next message instead of crashing
                    }
                }
                 console.log(`${logPrefix} Finished processing loop. Total emails successfully parsed: ${emails.length}`);
            } else {
                console.log(`${logPrefix} Mailbox does not exist or is empty.`);
            }
        } finally {
            lock.release();
            console.log(`${logPrefix} Mailbox lock released.`);
        }
        await client.logout();
        console.log(`${logPrefix} IMAP client logged out.`);
        res.json({ success: true, emails: emails.reverse() });
    } catch (err: any) {
        console.error(`${logPrefix} Full error:`, err);
        res.status(500).json({ success: false, message: 'Failed to sync emails due to a server error.' });
    }
});

app.post('/api/test-connection', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const logPrefix = `[TEST FOR ${email}]`;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const client = new ImapFlow({
        host: 'mail.veebimajutus.ee',
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
        logger: false,
    });

    try {
        console.log(`${logPrefix} Attempting to connect...`);
        await client.connect();
        console.log(`${logPrefix} Connection successful. Checking INBOX...`);
        const mailbox = await client.mailboxOpen('INBOX');
        const messageCount = mailbox.exists;
        console.log(`${logPrefix} INBOX opened. Found ${messageCount} messages.`);
        await client.logout();
        console.log(`${logPrefix} Logout successful.`);
        res.json({ success: true, message: `Connection successful! Found ${messageCount} messages in INBOX.` });
    } catch (err: any) {
        console.error(`${logPrefix} Test connection failed:`, err);
        res.status(401).json({ success: false, message: `Connection failed: ${err.message}` });
    }
});


app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
