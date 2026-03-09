import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export const healthPlugin = fp(async function (fastify: FastifyInstance) {
  fastify.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok', service: 'storefront-router' });
  });
});
