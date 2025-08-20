import { FastifyInstance } from 'fastify';
import { ImapService } from '../services/imap.service';
import { Mailbox, UserFolder } from '../../../types';

interface RawMailbox {
    path: string;
    name: string;
    delimiter: string;
    specialUse?: string;
    children: RawMailbox[];
}

export async function mailRoutes(fastify: FastifyInstance) {
  // Protect all routes in this file
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/mailboxes', async (request, reply) => {
    try {
      const imapService = new ImapService(request.credentials.imap, {user: request.credentials.email, pass: request.credentials.password });
      const rawMailboxTree = await imapService.listMailboxes();
      
      // Transform the raw tree into the formats the frontend expects
      const mailboxes: Mailbox[] = [];
      const userFolders: UserFolder[] = [];

      const processNode = (node: RawMailbox, parentId?: string, level: number = 0) => {
        const isSystemFolder = Object.values(request.credentials.imap).includes(node.path);

        // Add to mailboxes list
        mailboxes.push({
            path: node.path,
            name: node.name,
            delimiter: node.delimiter,
            specialUse: node.specialUse,
        });

        // Add to userFolders list if it's not a root-level system folder
        if (level > 0 || !node.specialUse) {
             userFolders.push({
                id: node.path,
                name: node.name,
                parentId: parentId,
                order: userFolders.length,
             });
        }
       
        node.children.forEach(child => processNode(child, node.path, level + 1));
      };

      rawMailboxTree.forEach(node => processNode(node));

      // TODO: Fetch labels from a persistent store if implementing them server-side.
      // For now, labels are mock data on the client.
      
      reply.send({ mailboxes, userFolders });
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: 'Failed to fetch mailboxes', error: error.message });
    }
  });

  fastify.get('/messages', async (request, reply) => {
    const { mailbox } = request.query as { mailbox: string };
    if (!mailbox) {
        return reply.status(400).send({ message: 'Mailbox path is required.' });
    }
    
    try {
        const imapService = new ImapService(request.credentials.imap, { user: request.credentials.email, pass: request.credentials.password });
        const emails = await imapService.fetchMessages(mailbox);
        reply.send(emails);
    } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({ message: `Failed to fetch messages from ${mailbox}`, error: error.message });
    }
  });
}