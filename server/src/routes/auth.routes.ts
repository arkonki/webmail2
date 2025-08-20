import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  imapHost: z.string().optional().default('mail.veebimajutus.ee'),
  imapPort: z.number().optional().default(993),
  smtpHost: z.string().optional().default('mail.veebimajutus.ee'),
  smtpPort: z.number().optional().default(465),
});

export default async function (server: FastifyInstance) {
  server.post('/login', async (request, reply) => {
    try {
      const loginData = loginSchema.parse(request.body);
      const result = await AuthService.login(loginData);
      
      reply.send(result);
    } catch (error: any) {
      server.log.error(error);
      reply.code(401).send({ message: error.message || 'Login failed' });
    }
  });

  server.get('/verify', { preHandler: [server.authenticate] }, async (request, reply) => {
    // If server.authenticate passes, the token is valid.
    reply.send({ message: 'Token is valid', user: request.user });
  });
}