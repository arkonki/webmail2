import { Worker, Job } from 'bullmq';
import redis from '../lib/redis';
import prisma from '../lib/prisma';
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

    const account = await prisma.account.findFirst({
        where: { userId },
        rejectOnNotFound: true,
    });

    const password = CryptoService.decrypt(account.encryptedPassword, account.iv);

    const mailOptions = {
        from: `"${(await prisma.user.findUnique({where: {id: userId}}))?.name}" <${account.email}>`,
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
