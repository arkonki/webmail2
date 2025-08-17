import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import { sendEmailQueue } from '../services/queue.service';
import { z } from 'zod';

export default async function (server: FastifyInstance) {

  // Get paginated list of messages in a folder
  server.get('/', { preHandler: [server.authenticate] }, async (request, reply) => {
    const { folder, page = '1', pageSize = '50' } = request.query as { folder: string; page?: string; pageSize?: string; };
    if (!folder) {
        return reply.code(400).send({ message: 'Folder path is required.' });
    }
    
    const pageNum = parseInt(page, 10);
    const size = parseInt(pageSize, 10);

    const emails = await prisma.email.findMany({
        where: {
            account: { user: { id: request.user.id } },
            folder: { path: folder }
        },
        orderBy: { timestamp: 'desc' },
        skip: (pageNum - 1) * size,
        take: size,
        include: { attachments: true }
    });

    return { emails };
  });

  // Send an email
  server.post('/send', { preHandler: [server.authenticate] }, async (request, reply) => {
    // In a real app, you'd use a multipart parser like @fastify/multipart
    // For simplicity, this example assumes JSON and no attachments
    const body = request.body as any;
    
    await sendEmailQueue.add('send-email', {
        userId: request.user.id,
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
        subject: body.subject,
        body: body.body,
        scheduleDate: body.scheduleDate
    });

    return reply.code(202).send({ message: 'Email sending job accepted.' });
  });

  // Update message flags
  server.post('/flags', { preHandler: [server.authenticate] }, async (request, reply) => {
    // TODO: Implement flag updates (isRead, isStarred)
    // This would likely queue a job in BullMQ to update flags via IMAP
    // and then update the local database.
    return reply.send({ message: 'Flag update not yet implemented.' });
  });
  
  // Delete messages (move to trash)
   server.post('/delete', { preHandler: [server.authenticate] }, async (request, reply) => {
    // TODO: Implement move to trash
    // This would queue a job in BullMQ to move messages via IMAP
    // and then update the local database.
    return reply.send({ message: 'Delete not yet implemented.' });
  });
}
