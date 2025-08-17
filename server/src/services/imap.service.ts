import { ImapFlow } from 'imapflow';

export class ImapService {
  public static async verifyCredentials(user: string, pass: string, host: string, port: number) {
    const client = new ImapFlow({
      host,
      port,
      secure: true,
      auth: { user, pass },
      logger: false, // Set to true for debugging
    });

    try {
      await client.connect();
      await client.logout();
    } catch (err: any) {
      // It's possible for logout to fail if connection drops, so we check the error type
      if (err.code !== 'EPIPE' && err.command !== 'LOGOUT') {
         throw new Error(`IMAP connection failed: ${err.message}`);
      }
    }
  }

  // TODO: Add methods for:
  // - listFolders()
  // - syncFolder(path)
  // - fetchMessage(uid)
  // - updateFlags(uid, flags)
  // - startIdle(callback)
}
