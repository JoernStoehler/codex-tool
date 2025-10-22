import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { TypeBoxTypeProvider, TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import Fastify from 'fastify';

import { CounterStore } from './counter-store.js';

declare module 'fastify' {
  interface FastifyInstance {
    counterStore: CounterStore;
  }
}

export interface BuildServerOptions {
  readonly counterDbPath?: string;
}

export type AppServer = ReturnType<typeof buildServer>;

const defaultCounterDbPath =
  process.env.COUNTER_DB_PATH ?? new URL('../data/counter.db', import.meta.url).pathname;

export function buildServer(options: BuildServerOptions = {}): AppServer {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info'
    }
  }).withTypeProvider<TypeBoxTypeProvider>();

  server.setValidatorCompiler(TypeBoxValidatorCompiler);

  server.register(cors, {
    origin: true
  });

  server.register(sensible);

  const counterStore = new CounterStore({
    databasePath: options.counterDbPath ?? defaultCounterDbPath
  });
  server.decorate('counterStore', counterStore);

  server.addHook('onClose', async () => {
    counterStore.close();
  });

  const counterResponse = Type.Object({
    value: Type.Number()
  });

  server.get(
    '/health',
    {
      schema: {
        response: {
          200: Type.Object({
            status: Type.Literal('ok'),
            uptime: Type.Number(),
            timestamp: Type.String({ format: 'date-time' })
          })
        }
      }
    },
    async () => ({
      status: 'ok' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    })
  );

  server.get(
    '/counter',
    {
      schema: {
        response: {
          200: counterResponse
        }
      }
    },
    async (request) => {
      request.log.debug('fetching counter value');
      const value = server.counterStore.getValue();
      return { value };
    }
  );

  server.post(
    '/counter/increment',
    {
      schema: {
        response: {
          200: counterResponse
        }
      }
    },
    async (request) => {
      request.log.debug('incrementing counter');
      const value = server.counterStore.increment();
      return { value };
    }
  );

  server.get('/counter/stream', async (request, reply) => {
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();

    const send = (value: number) => {
      reply.raw.write(`data: ${JSON.stringify({ value })}\n\n`);
    };

    send(server.counterStore.getValue());

    const listener = (value: number) => {
      send(value);
    };

    server.counterStore.onUpdate(listener);

    const close = () => {
      server.counterStore.removeListener(listener);
      reply.raw.end();
    };

    request.raw.on('close', close);
    request.raw.on('error', close);
  });

  return server;
}

export async function startServer(): Promise<AppServer> {
  const server = buildServer();

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ host, port });
    server.log.info({ host, port }, 'Flock API ready');
  } catch (error) {
    server.log.error(error, 'Failed to start Flock API');
    process.exitCode = 1;
  }

  return server;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  startServer().catch((error) => {
    // `startServer` already logged the error; this guard is defensive.
    console.error(error);
    process.exit(1);
  });
}
