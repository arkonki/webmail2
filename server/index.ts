import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
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

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
