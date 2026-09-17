const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { notFoundValue?: T },
): Promise<T> {
  const { notFoundValue, ...fetchOptions } = options ?? {};
  const hasNotFoundValue = options != null && 'notFoundValue' in options;

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (response.status === 404 && hasNotFoundValue) {
    return notFoundValue as T;
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      (typeof body.message === 'string' || Array.isArray(body.message))
        ? body.message
        : `${response.status}: ${response.statusText}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
