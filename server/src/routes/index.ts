import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes.js';
import folderRoutes from './folders.routes.js';
import messageRoutes from './messages.routes.js';
import labelRoutes from './labels.routes.js';
import contactRoutes from './contacts.routes.js';
import settingsRoutes from './settings.routes.js';

export default async function (server: FastifyInstance) {
  server.register(authRoutes, { prefix: '/auth' });
  server.register(folderRoutes, { prefix: '/folders' });
  server.register(messageRoutes, { prefix: '/messages' });
  server.register(labelRoutes, { prefix: '/labels' });
  server.register(contactRoutes, { prefix: '/contacts' });
  server.register(settingsRoutes, { prefix: '/settings' });
}