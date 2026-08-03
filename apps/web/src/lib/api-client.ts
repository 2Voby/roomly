import type { ApiErrorResponse, ApiSuccess } from '@roomly/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  const payload = (await response.json().catch(() => null)) as
    ApiSuccess<T> | ApiErrorResponse | null;

  if (!response.ok) {
    const error = payload && 'error' in payload ? payload.error : undefined;
    throw new ApiError(
      error?.message ?? 'Не вдалося виконати запит',
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.fields,
    );
  }

  if (!payload || !('data' in payload))
    throw new ApiError('Некоректна відповідь сервера', response.status, 'INVALID_RESPONSE');
  return payload.data;
}
