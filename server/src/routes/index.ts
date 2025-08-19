
import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import folderRoutes from './folders.routes';
import messageRoutes from './messages.routes';
import labelRoutes from './labels.routes';
import contactRoutes from './contacts.routes';
import settingsRoutes from './settings.routes';

export default async function (server: FastifyInstance) {
  server.register(authRoutes, { prefix: '/auth' });
  server.register(folderRoutes, { prefix: '/folders' });
  server.register(messageRoutes, { prefix: '/messages' });
  server.register(labelRoutes, { prefix: '/labels' });
  server.register(contactRoutes, { prefix: '/contacts' });
  server.register(settingsRoutes, { prefix: '/settings' });
}
