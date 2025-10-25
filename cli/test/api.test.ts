import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiGet, apiPost } from '../src/lib/api.js';

declare const Response: typeof globalThis.Response;

describe('api helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.FLOCK_API_URL;
  });

  it('performs GET requests against the default base URL', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ value: 42 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

    const result = await apiGet<{ value: number }>('counter');

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/counter', {
      headers: { Accept: 'application/json' },
      method: 'GET'
    });
    expect(result).toEqual({ value: 42 });
  });

  it('performs POST requests using the configured base URL', async () => {
    process.env.FLOCK_API_URL = 'http://api.internal:8080';

    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ value: 7 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

    const result = await apiPost<{ value: number }>('counter/increment');

    expect(fetchMock).toHaveBeenCalledWith('http://api.internal:8080/counter/increment', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: undefined
    });
    expect(result).toEqual({ value: 7 });
  });

  it('throws informative error on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('boom', {
        status: 500,
        statusText: 'Server Error'
      })
    );

    await expect(apiGet('counter')).rejects.toThrow(
      'Request failed with status 500: boom'
    );
  });

  it('returns undefined for empty successful responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 204,
        statusText: 'No Content'
      })
    );

    await expect(apiGet<undefined>('health')).resolves.toBeUndefined();
  });

  it('returns plain text payloads when JSON is not provided', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('pong', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    );

    await expect(apiGet<string>('health')).resolves.toBe('pong');
  });
});
