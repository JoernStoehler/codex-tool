import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import './app.css';

const API_BASE_URL =
  (import.meta.env.VITE_FLOCK_API_URL as string | undefined) ?? 'http://127.0.0.1:3000';

const COUNTER_QUERY_KEY = ['counter'];

interface CounterPayload {
  value: number;
}

async function fetchCounter(): Promise<CounterPayload> {
  const response = await fetch(resolveUrl('counter'), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch counter: ${response.statusText}`);
  }

  return (await response.json()) as CounterPayload;
}

async function incrementCounter(): Promise<CounterPayload> {
  const response = await fetch(resolveUrl('counter/increment'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to increment counter: ${response.statusText}`);
  }

  return (await response.json()) as CounterPayload;
}

function resolveUrl(path: string): string {
  return new URL(path, API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`).toString();
}

function App(): ReactElement {
  const queryClient = useQueryClient();

  const counterQuery = useQuery({
    queryKey: COUNTER_QUERY_KEY,
    queryFn: fetchCounter,
    staleTime: Infinity
  });

  const incrementMutation = useMutation({
    mutationFn: incrementCounter,
    onSuccess: (data) => {
      queryClient.setQueryData(COUNTER_QUERY_KEY, data);
    }
  });

  useEffect(() => {
    const streamUrl = resolveUrl('counter/stream');
    const source = new EventSource(streamUrl);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as CounterPayload;
        queryClient.setQueryData(COUNTER_QUERY_KEY, payload);
      } catch (error) {
        console.error('Failed to parse counter stream payload', error);
      }
    };

    source.onerror = (event) => {
      console.error('Counter stream encountered an error', event);
    };

    return () => {
      source.close();
    };
  }, [queryClient]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Flock Console</h1>
        <p className="app__subtitle">
          Minimal end-to-end slice: Fastify API, CLI, and web console sharing a counter.
        </p>
      </header>

      <section className="app__content">
        <article className="card">
          <h2>Counter</h2>
          {counterQuery.isPending && <p>Loading counter…</p>}
          {counterQuery.isError && (
            <p className="error">Failed to load counter: {counterQuery.error.message}</p>
          )}
          {counterQuery.data && (
            <>
              <p className="counter__value">{counterQuery.data.value}</p>
              <button
                type="button"
                className="counter__button"
                onClick={() => {
                  incrementMutation.mutate();
                }}
                disabled={incrementMutation.isPending}
              >
                {incrementMutation.isPending ? 'Incrementing…' : 'Increment'}
              </button>
            </>
          )}
        </article>

        <article className="card">
          <h2>How to interact</h2>
          <ol>
            <li>Run <code>flock api dev</code> (or `npm run dev:api`) to start the API.</li>
            <li>
              Run <code>flock cli dev</code> to rebuild the CLI and use{' '}
              <code>npm run cli -- counter increment</code> to mutate the value.
            </li>
            <li>
              Use <code>flock counter show</code> (global CLI) to read the value from the API.
            </li>
            <li>The web console listens to live updates via server-sent events.</li>
          </ol>
        </article>
      </section>
    </main>
  );
}

export default App;
