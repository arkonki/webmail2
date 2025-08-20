import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.routes';
import { mailRoutes } from './routes/mail.routes';
import { config } from './config';
import { authPlugin } from './plugins/auth';

const server = Fastify({
  logger: true,
});

// Register plugins
server.register(cors, {
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
});

server.register(cookie);
server.register(jwt, { 
    secret: config.JWT_SECRET,
    cookie: {
        cookieName: 'token',
        signed: false, // JWT is already signed
    }
});
server.register(authPlugin);

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(mailRoutes, { prefix: '/api/mail' });


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