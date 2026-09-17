export class AdminError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
export async function adminApi<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/admin${path}`, {
    method: body === undefined ? 'GET' : method,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-Bandit-Admin': '1' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success)
    throw new AdminError(
      result?.error ?? 'The service is unavailable. Please retry.',
      response.status
    );
  return result.data as T;
}
export const money = (value: string | number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
    Number(value) / 100
  );
export const label = (value: string) =>
  value === 'AWAITING_WHATSAPP' ? 'New enquiry' : value.toLowerCase().replace(/_/g, ' ');
export const inputClass =
  'mt-1 block min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm';
export const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50';
