
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyWebsocket, { SocketStream } from '@fastify/websocket';
import jwt from 'jsonwebtoken';
import config from '../config';
import { WebSocket } from 'ws';

declare module 'fastify' {
  interface RouteShorthandOptions {
    websocket?: boolean;
  }
}

// Simple in-memory store for clients for this example
// In a clustered production setup, you'd use Redis Pub/Sub to broadcast across instances
export const clients = new Map<string, WebSocket>();

async function websocketPlugin(server: FastifyInstance) {
  server.register(fastifyWebsocket);

  server.register(async function (fastify) {
    fastify.get('/socket', { websocket: true }, (connection: SocketStream, req) => {
      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'auth' && data.token) {
            const decoded = jwt.verify(data.token, config.JWT_SECRET) as { id: string };
            clients.set(decoded.id, connection.socket);
            fastify.log.info(`WebSocket client connected for user ${decoded.id}`);
            
            connection.socket.on('close', () => {
              clients.delete(decoded.id);
               fastify.log.info(`WebSocket client disconnected for user ${decoded.id}`);
            });
          }
        } catch (error) {
          fastify.log.error({ msg: 'WebSocket auth error', error });
          connection.socket.close();
        }
      });
    });
  });
}

export default fp(websocketPlugin);