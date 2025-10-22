import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

interface CounterPayload {
  value: number;
}

const eventSources: MockEventSource[] = [];

class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;

  onerror: ((event: Event) => void) | null = null;

  constructor(public readonly url: string) {
    eventSources.push(this);
  }

  close = vi.fn();

  emit(payload: CounterPayload): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
  }
}

describe('App counter view', () => {
  beforeEach(() => {
    eventSources.length = 0;
    global.EventSource = MockEventSource as unknown as typeof EventSource;

    let counter = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        counter += 1;
        return new Response(JSON.stringify({ value: counter }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ value: counter }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    eventSources.length = 0;
  });

  it('shows the counter value, increments, and reacts to stream updates', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/^0$/)).toBeInTheDocument();

    const incrementButton = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(incrementButton);

    await waitFor(() => {
      expect(screen.getByText(/^1$/)).toBeInTheDocument();
    });

    const source = eventSources.at(-1);
    expect(source).toBeDefined();
    source?.emit({ value: 5 });

    await waitFor(() => {
      expect(screen.getByText(/^5$/)).toBeInTheDocument();
    });
  });
});
