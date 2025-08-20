import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { authRoutes } from './routes/auth.routes';
import { config } from './config';

const server = Fastify({
  logger: true,
});

// Register plugins
server.register(cors, {
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
});

server.register(cookie);

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });


const start = async () => {
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    server.log.error(err);
    (process as any).exit(1);
  }
};

start();