import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer, type AppServer } from '../src/server.js';

describe('api server', () => {
  let server: AppServer;

  beforeAll(async () => {
    server = buildServer({ counterDbPath: ':memory:' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('returns ok status payload', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json() as { status: string; uptime: number; timestamp: string };
    expect(payload.status).toBe('ok');
    expect(typeof payload.uptime).toBe('number');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('exposes current counter value', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/counter'
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json() as { value: number };
    expect(payload.value).toBe(0);
  });

  it('increments the counter atomically', async () => {
    const increment = await server.inject({
      method: 'POST',
      url: '/counter/increment'
    });

    expect(increment.statusCode).toBe(200);
    const incrementPayload = increment.json() as { value: number };
    expect(incrementPayload.value).toBe(1);

    const check = await server.inject({
      method: 'GET',
      url: '/counter'
    });

    expect(check.statusCode).toBe(200);
    const checkPayload = check.json() as { value: number };
    expect(checkPayload.value).toBe(1);
  });
});
