import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import folderRoutes from './folders.routes';
import messageRoutes from './messages.routes';

export default async function (server: FastifyInstance) {
  server.register(authRoutes, { prefix: '/auth' });
  server.register(folderRoutes, { prefix: '/folders' });
  server.register(messageRoutes, { prefix: '/messages' });
  // Add other routes here
}
