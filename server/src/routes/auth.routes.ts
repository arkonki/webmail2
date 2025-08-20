import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { MailAuthService } from '../services/mailAuth.service';
import { config } from '../config';
import { encrypt } from '../services/crypto.service';
import '@fastify/cookie';

const loginSchema = z.object({
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

export async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/login', async (request, reply) => {
    try {
      const loginDetails = loginSchema.parse(request.body);

      // Verify credentials by connecting to IMAP
      const isValid = await MailAuthService.verifyCredentials(loginDetails.email, loginDetails.password, loginDetails.imap);

      if (!isValid) {
        return reply.status(401).send({ message: 'Invalid credentials or IMAP server settings.' });
      }

      // Encrypt credentials for the session
      const encryptedCredentials = encrypt(JSON.stringify(loginDetails));

      // Create JWT using the fastify-jwt decorator
      const token = fastify.jwt.sign({ user: loginDetails.email, data: encryptedCredentials }, {
        expiresIn: '8h',
      });

      // Send JWT in a secure, httpOnly cookie
      reply
        .setCookie('token', token, {
          httpOnly: true,
          secure: config.NODE_ENV === 'production', // should be true in production
          sameSite: 'strict',
          path: '/',
          maxAge: 8 * 60 * 60, // 8 hours
        })
        .status(200)
        .send({ message: 'Login successful', user: { email: loginDetails.email, name: loginDetails.email.split('@')[0] } });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ message: 'Invalid request body', errors: error.issues });
        }
      fastify.log.error(error);
      reply.status(500).send({ message: error.message || 'An error occurred during login.' });
    }
  });

  fastify.post('/logout', async (request, reply) => {
      reply.clearCookie('token', { path: '/' }).status(200).send({ message: 'Logout successful' });
  });

   fastify.get('/session', async (request, reply) => {
    try {
      const token = request.cookies.token;
      if (!token) {
        return reply.status(401).send({ message: 'Not authenticated' });
      }

      // Verify token using the fastify-jwt decorator
      const decoded: any = fastify.jwt.verify(token);
      reply.status(200).send({ user: { email: decoded.user, name: decoded.user.split('@')[0] } });

    } catch (error) {
        reply.status(401).send({ message: 'Invalid or expired token' });
    }
  });
}