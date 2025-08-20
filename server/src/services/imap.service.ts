
import { ImapFlow, ImapFlowOptions, MailboxObject } from 'imapflow';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { Email, Attachment } from '../../../types';

export class ImapService {
  private client: ImapFlow;

  constructor(imapConfig: Omit<ImapFlowOptions, 'auth'>, auth: { user: string, pass: string }) {
    this.client = new ImapFlow({
      ...imapConfig,
      auth,
      logger: false, // set to true for verbose logging
    });
  }

  private async connect() {
    await this.client.connect();
  }

  private async disconnect() {
    await this.client.logout();
  }

  async listMailboxes(): Promise<MailboxObject[]> {
    await this.connect();
    const mailboxes = await this.client.listTree();
    await this.disconnect();
    return mailboxes;
  }

  async fetchMessages(mailboxPath: string): Promise<Email[]> {
    await this.connect();
    const emails: Email[] = [];

    const getFirstAddress = (headerValue: ParsedMail['from'] | ParsedMail['to']): { name: string; address?: string; } | undefined => {
        if (!headerValue) {
            return undefined;
        }
        const addresses = 'value' in headerValue ? headerValue.value : headerValue;
        if (Array.isArray(addresses) && addresses.length > 0) {
            let first = addresses[0];
            
            const resolveAddress = (addr: AddressObject): { name: string; address?: string; } | undefined => {
                if ('group' in addr && addr.group && addr.group.length > 0) {
                    return resolveAddress(addr.group[0]);
                }
                if ('address' in addr) {
                    return addr;
                }
                return undefined;
            }
            return resolveAddress(first);
        }
        return undefined;
    };

    try {
        const lock = await this.client.getMailboxLock(mailboxPath);
        
        if (!this.client.mailbox) {
            lock.release();
            await this.disconnect();
            throw new Error(`Failed to open mailbox: ${mailboxPath}`);
        }
        
        const messageCount = this.client.mailbox.exists;
        if (messageCount === 0) {
            lock.release();
            await this.disconnect();
            return [];
        }

        const startSeq = Math.max(1, messageCount - 49);
        const seqRange = `${startSeq}:${messageCount}`;

        for await (let msg of this.client.fetch(seqRange, { source: true, envelope: true, uid: true, flags: true })) {
            try {
                const parsedMail: ParsedMail = await simpleParser(msg.source);
                
                const from = getFirstAddress(parsedMail.from);
                const to = getFirstAddress(parsedMail.to);
                
                if (!from || !to || !from.address || !to.address) continue; // Skip if essential fields are missing
                
                const attachments: Attachment[] = parsedMail.attachments?.map(att => ({
                    fileName: att.filename || 'attachment',
                    fileSize: att.size,
                    mimeType: att.contentType,
                    // We don't provide a URL here; that would require another endpoint to stream the attachment
                })) || [];
                
                const snippet = (parsedMail.text || '').substring(0, 150).replace(/\s+/g, ' ').trim();

                const email: Email = {
                    id: msg.uid.toString(),
                    conversationId: 'conv-' + Buffer.from(parsedMail.subject || '(no subject)').toString('base64'),
                    senderName: from.name || from.address || 'Unknown Sender',
                    senderEmail: from.address,
                    recipientEmail: to.address,
                    subject: parsedMail.subject || '(no subject)',
                    body: parsedMail.html || `<pre>${parsedMail.text || ''}</pre>`,
                    snippet: snippet,
                    timestamp: (parsedMail.date || new Date()).toISOString(),
                    isRead: msg.flags.has('\\Seen'),
                    folderId: mailboxPath,
                    labelIds: [], // IMAP flags could be mapped to labels, but keeping it simple for now
                    attachments: attachments,
                    messageId: parsedMail.messageId,
                };

                emails.push(email);
            } catch (parseErr) {
                console.error(`Failed to parse email with UID ${msg.uid}:`, parseErr);
            }
        }
        lock.release();
    } catch (err) {
        console.error(`Error fetching messages from ${mailboxPath}:`, err);
        // Ensure we disconnect even if there's an error
    } finally {
        if (this.client.state !== 'logout') {
            await this.disconnect();
        }
    }
    
    // Return emails in descending order (newest first)
    return emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
