import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';

export class SmtpService {
    private static createTransport(user: string, pass: string, host: string, port: number) {
        return nodemailer.createTransport({
            host,
            port,
            secure: true, // true for 465, false for other ports
            auth: { user, pass },
        });
    }
    
    public static async verifyCredentials(user: string, pass: string, host: string, port: number) {
        const transporter = this.createTransport(user, pass, host, port);
        try {
            const success = await transporter.verify();
            if (!success) {
                throw new Error('SMTP server responded with an error during verification.');
            }
        } catch (err: any) {
            throw new Error(`SMTP connection failed: ${err.message}`);
        }
    }

    public static async sendMail(user: string, pass: string, host: string, port: number, mailOptions: MailOptions) {
        const transporter = this.createTransport(user, pass, host, port);
        try {
            return await transporter.sendMail(mailOptions);
        } catch (err: any) {
            console.error(`Failed to send email for ${user}`, err);
            throw new Error(`SMTP send failed: ${err.message}`);
        }
    }
}
