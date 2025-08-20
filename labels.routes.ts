import { FastifyInstance } from 'fastify';

export default async function (server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate);

  server.get('/', async (request, reply) => {
    // Mock implementation
    return reply.send({ labels: [] });
  });

  server.post('/', async (request, reply) => {
    // Mock implementation
    const newLabel = { id: `label-${Date.now()}`, ...request.body as object, order: 0 };
    return reply.code(201).send(newLabel);
  });

  server.put('/:id', async (request, reply) => {
    // Mock implementation
    return reply.send({ message: 'Label updated' });
  });

  server.delete('/:id', async (request, reply) => {
    // Mock implementation
    return reply.code(204).send();
  });

  server.post('/reorder', async (request, reply) => {
    // Mock implementation
    return reply.send([]);
  });
}
