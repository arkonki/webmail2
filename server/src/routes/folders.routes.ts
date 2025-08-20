import { FastifyInstance } from 'fastify';
import db from '../lib/db.js';
import { UserFolder, Mailbox } from '../types.js';

export default async function (server: FastifyInstance) {
  
  server.get('/', { preHandler: [server.authenticate] }, async (request, reply) => {
    try {
        const accountResult = await db.query('SELECT id FROM "Account" WHERE "userId" = $1', [request.user.id]);
        if (accountResult.rows.length === 0) {
            return reply.code(404).send({ message: 'Account not found for user.' });
        }
        const accountId = accountResult.rows[0].id;

        // In a real sync-based app, this would be more complex, fetching from IMAP first.
        // For now, we return what's in our DB.
        const mailboxesResult = await db.query('SELECT path, name, "specialUse", delimiter FROM "Folder" WHERE "accountId" = $1', [accountId]);
        
        // This app's frontend differentiates between mailboxes (from IMAP) and user-created folders.
        // For this implementation, we'll treat them as the same.
        const userFolders: UserFolder[] = mailboxesResult.rows.map((r, index) => ({
            id: r.path, // Use path as ID for simplicity
            name: r.name,
            order: index,
        }));
        
        const mailboxes: Mailbox[] = mailboxesResult.rows as Mailbox[];

        return { userFolders, mailboxes };

    } catch (error: any) {
        server.log.error(`Failed to fetch folders for user ${request.user.id}:`, error);
        reply.code(500).send({ message: 'Failed to retrieve folders.' });
        return;
    }
  });

}