import { FastifyInstance } from 'fastify';

export default async function (server: FastifyInstance) {
  // Most routes require authentication
  const authRoutes = async (authedServer: FastifyInstance) => {
    authedServer.addHook('preHandler', authedServer.authenticate);

    const initialAppSettings = {
        identities: [],
        signature: { isEnabled: false, body: '' },
        autoResponder: { isEnabled: false, subject: '', message: '' },
        rules: [],
        sendDelay: { isEnabled: true, duration: 5 },
        notifications: { enabled: false },
        conversationView: true,
        blockExternalImages: true,
        templates: [],
        displayDensity: 'comfortable',
        folderMappings: {},
    };
  
    authedServer.get('/', async (request, reply) => {
      return reply.send(initialAppSettings);
    });
  
    authedServer.post('/', async (request, reply) => {
      return reply.send({ message: 'Settings updated' });
    });
  
    authedServer.post('/rules', async (request, reply) => {
      const newRule = { id: `rule-${Date.now()}`, ...request.body as object };
      return reply.code(201).send(newRule);
    });
  
    authedServer.delete('/rules/:id', async (request, reply) => {
      return reply.code(204).send();
    });
  
    authedServer.put('/identities/:id', async (request, reply) => {
      return reply.send({ message: 'Identity updated' });
    });
  
    authedServer.post('/templates', async (request, reply) => {
      const newTemplate = { id: `template-${Date.now()}`, ...request.body as object };
      return reply.code(201).send(newTemplate);
    });
  
    authedServer.put('/templates/:id', async (request, reply) => {
      return reply.send({ message: 'Template updated' });
    });
  
    authedServer.delete('/templates/:id', async (request, reply) => {
      return reply.code(204).send();
    });

    authedServer.post('/setup/complete', async (request, reply) => {
      return reply.code(204).send();
    });
  }

  server.register(authRoutes);

  // This route is special and does not require a JWT
  server.post('/test-connection', async (request, reply) => {
    // Mock response for developer tools
    return reply.send({ success: true, message: 'IMAP connection successful.' });
  });
}
