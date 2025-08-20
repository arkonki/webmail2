import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import '@fastify/jwt';
import { decrypt } from '../services/crypto.service';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  imap: z.object({
    host: z.string(),
    port: z.number(),
    secure: z.boolean(),
  }),
  smtp: z.object({
    host: z.string(),
    port: z.number(),
    secure: z.boolean(),
  }),
});

export type Credentials = z.infer<typeof credentialsSchema>;

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { user: string; data: string };
    user: {
      user: string;
      data: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    credentials: Credentials;
  }
}

async function authPluginImpl(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const encryptedData = request.user.data;
      if (!encryptedData) {
        throw new Error('No credential data in token');
      }
      const decryptedData = decrypt(encryptedData);
      const credentials = credentialsSchema.parse(JSON.parse(decryptedData));
      
      // Decorate request with credentials for this request lifecycle
      request.credentials = credentials;

    } catch (err) {
      reply.status(401).send({ message: 'Authentication failed', error: (err as Error).message });
    }
  });
}

export const authPlugin = fp(authPluginImpl);