import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import db from '../lib/db.js';
import { sendEmailQueue, mailSyncQueue } from '../services/queue.service.js';

const getMessagesQuerySchema = z.object({
    folder: z.string().optional(),
    label: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(50),
});

const messageActionSchema = z.object({
    conversationIds: z.array(z.string()),
});

export default async function (server: FastifyInstance) {

  // Get paginated list of messages in a folder or with a label
  server.get('/', { preHandler: [server.authenticate] }, async (request, reply) => {
    const queryResult = getMessagesQuerySchema.safeParse(request.query);
    if (!queryResult.success) {
        return reply.code(400).send({ message: 'Invalid query parameters.', errors: queryResult.error.issues });
    }
    const { folder, label, page, pageSize } = queryResult.data;
    
    if (!folder && !label) {
        return reply.code(400).send({ message: 'Either a folder or label must be provided.' });
    }
    
    const offset = (page - 1) * pageSize;

    // This is a simplified query. A real implementation would be much more complex
    // to handle conversations, labels (many-to-many), etc.
    const query = `
      SELECT e.*,
        (
          SELECT COALESCE(json_agg(json_build_object('fileName', att.filename, 'mimeType', att."mimeType", 'fileSize', att.size)), '[]')
          FROM "Attachment" att WHERE att."emailId" = e.id
        ) as attachments
      FROM "Email" e
      JOIN "Account" a ON e."accountId" = a.id
      JOIN "Folder" f ON e."folderId" = f.id
      WHERE a."userId" = $1 AND f.path = $2
      ORDER BY e.timestamp DESC
      LIMIT $3
      OFFSET $4
    `;

    const { rows: emails } = await db.query(query, [request.user.id, folder, pageSize, offset]);

    return { emails };
  });

  // Send an email
  server.post('/send', { preHandler: [server.authenticate] }, async (request, reply) => {
    // Note: Fastify with @fastify/multipart handles the request body parsing.
    // The handler receives parts instead of a single body object.
    const data: any = {};
    const attachments: any[] = [];
    
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        attachments.push({
          filename: part.filename,
          content: buffer,
          contentType: part.mimetype,
        });
      } else { // part.type === 'field'
        data[part.fieldname] = part.value;
      }
    }
    
    await sendEmailQueue.add('send-email', {
        userId: request.user.id,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        attachments: attachments,
        scheduleDate: data.scheduleDate
    });

    return reply.code(202).send({ message: 'Email sending job accepted.' });
  });

  // Update message flags
  server.post('/flags', { preHandler: [server.authenticate] }, async (request, reply) => {
    const { conversationIds, flags } = request.body as { conversationIds: string[], flags: any };
    await mailSyncQueue.add('update-flags', {
        userId: request.user.id,
        conversationIds,
        flags
    });
    return reply.code(202).send({ message: 'Flag update queued.' });
  });
  
  // Delete messages (move to trash)
   server.post('/delete', { preHandler: [server.authenticate] }, async (request, reply) => {
    const { conversationIds } = messageActionSchema.parse(request.body);
    await mailSyncQueue.add('move-to-trash', {
        userId: request.user.id,
        conversationIds
    });
    return reply.code(202).send({ message: 'Delete action queued.' });
  });
}