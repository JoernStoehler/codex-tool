const DEFAULT_API_BASE_URL = process.env.FLOCK_API_URL ?? 'http://127.0.0.1:3000';

function resolveBaseUrl(): string {
  return process.env.FLOCK_API_URL ?? DEFAULT_API_BASE_URL;
}

function resolveUrl(path: string): string {
  const base = resolveBaseUrl();
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request failed with status ${response.status}: ${body || response.statusText}`
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return text as unknown as T;
    }

    throw error;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(resolveUrl(path), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(resolveUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return handleResponse<T>(response);
}
