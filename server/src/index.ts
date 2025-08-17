/// <reference types="node" />

import { process } from 'node:process';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import swaggerPlugin from './plugins/swagger';
import websocketPlugin from './plugins/websocket';
import authPlugin from './plugins/auth';
import routes from './routes';
import config from './config';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
    };
  }
}

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function main() {
  // Register Plugins
  await server.register(cors, {
    origin: '*', // Configure for production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await server.register(swaggerPlugin);
  await server.register(websocketPlugin);
  await server.register(authPlugin);
  
  // Register Routes
  await server.register(routes, { prefix: '/api' });

  // Start Server
  try {
    await server.listen({ port: config.PORT, host: config.HOST });
    server.log.info(`Server listening on http://${config.HOST}:${config.PORT}`);
    server.log.info(`Swagger docs at http://${config.HOST}:${config.PORT}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();