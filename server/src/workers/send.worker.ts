import { Worker, Job } from 'bullmq';
import redis from '../lib/redis';
import db from '../lib/db';
import { CryptoService } from '../services/crypto.service';
import { SmtpService } from '../services/smtp.service';

interface SendEmailJobData {
    userId: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
}

const sendEmailWorker = new Worker('send-email', async (job: Job<SendEmailJobData>) => {
    const { userId, to, subject, body, cc, bcc } = job.data;
    console.log(`Processing send-email job ${job.id} for user ${userId}`);

    const accountResult = await db.query('SELECT * FROM "Account" WHERE "userId" = $1', [userId]);
    if (accountResult.rows.length === 0) {
        throw new Error(`Account not found for user ID: ${userId}`);
    }
    const account = accountResult.rows[0];
    
    const userResult = await db.query('SELECT name FROM "User" WHERE id = $1', [userId]);
    const userName = userResult.rows.length > 0 ? userResult.rows[0].name : account.email;

    const password = CryptoService.decrypt(account.encryptedPassword, account.iv);

    const mailOptions = {
        from: `"${userName}" <${account.email}>`,
        to,
        cc,
        bcc,
        subject,
        html: body,
    };

    await SmtpService.sendMail(account.email, password, account.smtpHost, account.smtpPort, mailOptions);
    
    // TODO: After sending, append the message to the Sent folder using ImapService.
    console.log(`Successfully sent email for job ${job.id}`);

}, { connection: redis });


sendEmailWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});