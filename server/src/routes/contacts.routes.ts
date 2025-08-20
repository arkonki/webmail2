import { FastifyInstance } from 'fastify';

export default async function (server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate);

  server.get('/', async (request, reply) => {
    return reply.send({ contacts: [] });
  });

  server.post('/', async (request, reply) => {
    const newContact = { id: `contact-${Date.now()}`, ...request.body as object };
    return reply.code(201).send(newContact);
  });

  server.put('/:id', async (request, reply) => {
    return reply.send({ message: 'Contact updated' });
  });

  server.delete('/:id', async (request, reply) => {
    return reply.code(204).send();
  });

  server.post('/import', async (request, reply) => {
    return reply.send({ imported: [], skipped: 0 });
  });

  server.get('/groups', async (request, reply) => {
    return reply.send({ groups: [] });
  });

  server.post('/groups', async (request, reply) => {
    const newGroup = { id: `group-${Date.now()}`, contactIds: [], ...request.body as object };
    return reply.code(201).send(newGroup);
  });

  server.put('/groups/:id', async (request, reply) => {
    return reply.send({ message: 'Group renamed' });
  });

  server.delete('/groups/:id', async (request, reply) => {
    return reply.code(204).send();
  });

  server.post('/groups/:id/members', async (request, reply) => {
    return reply.send({ message: 'Member added' });
  });

  server.delete('/groups/:id/members/:contactId', async (request, reply) => {
    return reply.code(204).send();
  });
}
