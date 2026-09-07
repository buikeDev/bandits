import type { ApiResponse } from '@bandit/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`API returned ${response.status}. Confirm the backend is running on port 3001.`);
  }
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error ?? 'Request failed');
  }
  return body.data;
}
