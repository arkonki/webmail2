import { ImapFlow, ImapFlowOptions } from 'imapflow';

export class MailAuthService {
  static async verifyCredentials(user: string, pass: string, imapConfig: Omit<ImapFlowOptions, 'auth'>): Promise<boolean> {
    const client = new ImapFlow({
      ...imapConfig,
      auth: { user, pass },
      logger: false, // Set to true for detailed debugging
    });

    try {
      await client.connect();
      await client.logout();
      return true;
    } catch (err) {
      console.error('IMAP authentication failed:', err);
      return false;
    }
  }
}
