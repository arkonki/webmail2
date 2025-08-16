import * as express from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

dotenv.config();

const app: express.Application = express();
const port = 3001;

// Use a general CORS configuration for development to allow all origins.
// This is more robust for local testing than a specific origin.
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for attachments

// In-memory store for scheduled jobs. In a real production app, this should be a persistent store like Redis.
const scheduledJobs = new Map<string, NodeJS.Timeout>();

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

app.post('/api/folders', async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;
    const logPrefix = `[FOLDERS FOR ${email}]`;

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
        console.log(`${logPrefix} Connecting to list folders...`);
        await client.connect();
        console.log(`${logPrefix} Connected. Listing folders...`);

        let folders = await client.list();
        
        const requiredFolders = {
            '\\Sent': 'Sent',
            '\\Drafts': 'Drafts',
            '\\Junk': 'Spam',
            '\\Trash': 'Trash'
        };

        const existingSpecialUseFolders = new Set(folders.map(f => f.specialUse).filter(Boolean));

        for (const [specialUse, name] of Object.entries(requiredFolders)) {
            if (!existingSpecialUseFolders.has(specialUse)) {
                console.log(`${logPrefix} System folder for ${specialUse} (${name}) not found. Creating...`);
                try {
                    // Check if a folder with that name already exists, just without the flag
                    const folderExists = folders.some(f => f.path === name);
                    if (!folderExists) {
                         await client.mailboxCreate(name);
                         console.log(`${logPrefix} Created folder: ${name}`);
                    } else {
                         console.log(`${logPrefix} Folder '${name}' already exists but lacks the special-use flag. The server may assign it automatically.`);
                    }
                } catch (createError: any) {
                    console.warn(`${logPrefix} Could not create folder ${name}. It may already exist. Error: ${createError.message}`);
                }
            }
        }
        
        // List again to get the full, updated list with correct flags
        folders = await client.list();

        await client.logout();
        console.log(`${logPrefix} Successfully retrieved and verified system folders.`);

        const mailboxes = folders.map(folder => ({
            path: folder.path,
            name: folder.name,
            specialUse: folder.specialUse || undefined,
            delimiter: folder.delimiter,
        }));

        res.json({ success: true, mailboxes });

    } catch (err: any) {
        console.error(`${logPrefix} Failed to list/create folders:`, err);
        res.status(500).json({ success: false, message: 'Failed to manage mail folders.' });
    }
});

app.post('/api/sync', async (req: express.Request, res: express.Response) => {
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
                            folderId: 'INBOX', // Sync only works on INBOX for now
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

app.post('/api/test-connection', async (req: express.Request, res: express.Response) => {
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

app.post('/api/send', async (req: express.Request, res: express.Response) => {
    const { email, password, from, to, cc, bcc, subject, body, attachments } = req.body;
    const logPrefix = `[SEND FOR ${email}]`;

    if (!email || !password || !to) {
        return res.status(400).json({ success: false, message: 'Missing required fields for sending email.' });
    }

    const transporter = nodemailer.createTransport({
        host: 'mail.veebimajutus.ee',
        port: 465, // Use 465 for SSL
        secure: true, // true for 465, false for other ports
        auth: {
            user: email,
            pass: password,
        },
    });

    const mailOptions = {
        from, // e.g., '"Your Name" <your.email@example.com>'
        to,
        cc,
        bcc,
        subject,
        html: body,
        attachments: (attachments || []).map((att: any) => ({
            filename: att.filename,
            content: att.content,
            encoding: 'base64',
            contentType: att.contentType,
        })),
    };

    try {
        console.log(`${logPrefix} Attempting to send email to ${to}...`);
        await transporter.sendMail(mailOptions);
        console.log(`${logPrefix} Email sent successfully.`);
        res.json({ success: true, message: 'Email sent successfully.' });
    } catch (error: any) {
        console.error(`${logPrefix} Failed to send email:`, error);
        res.status(500).json({ success: false, message: `Failed to send email: ${error.message}` });
    }
});

app.post('/api/schedule-send', async (req: express.Request, res: express.Response) => {
    const { email, password, from, to, cc, bcc, subject, body, attachments, scheduleDate } = req.body;
    const logPrefix = `[SCHEDULE FOR ${email}]`;

    if (!email || !password || !to || !scheduleDate) {
        return res.status(400).json({ success: false, message: 'Missing required fields for scheduling an email.' });
    }

    const sendTime = new Date(scheduleDate).getTime();
    const now = Date.now();
    const delay = sendTime - now;

    if (delay <= 0) {
        return res.status(400).json({ success: false, message: 'Schedule date must be in the future.' });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const transporter = nodemailer.createTransport({
        host: 'mail.veebimajutus.ee',
        port: 465,
        secure: true,
        auth: { user: email, pass: password },
    });

    const mailOptions = {
        from, to, cc, bcc, subject, html: body,
        attachments: (attachments || []).map((att: any) => ({
            filename: att.filename,
            content: att.content,
            encoding: 'base64',
            contentType: att.contentType,
        })),
    };

    const timeoutId = setTimeout(() => {
        console.log(`${logPrefix} Sending scheduled email job ${jobId} to ${to}...`);
        transporter.sendMail(mailOptions)
            .then(() => {
                console.log(`${logPrefix} Successfully sent scheduled email job ${jobId}.`);
            })
            .catch(error => {
                console.error(`${logPrefix} Failed to send scheduled email job ${jobId}:`, error);
            })
            .finally(() => {
                scheduledJobs.delete(jobId);
            });
    }, delay);

    scheduledJobs.set(jobId, timeoutId);
    console.log(`${logPrefix} Email job ${jobId} scheduled to be sent in ${delay}ms.`);
    res.json({ success: true, message: 'Email scheduled successfully.', jobId });
});

app.post('/api/cancel-scheduled-send', async (req: express.Request, res: express.Response) => {
    const { jobId } = req.body;
    const logPrefix = `[CANCEL SCHEDULE]`;

    if (!jobId) {
        return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    const timeoutId = scheduledJobs.get(jobId);

    if (timeoutId) {
        clearTimeout(timeoutId);
        scheduledJobs.delete(jobId);
        console.log(`${logPrefix} Cancelled scheduled job ${jobId}.`);
        res.json({ success: true, message: 'Scheduled send cancelled.' });
    } else {
        console.warn(`${logPrefix} Could not find scheduled job ${jobId} to cancel. It may have already been sent.`);
        res.status(404).json({ success: false, message: 'Scheduled job not found.' });
    }
});


app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
