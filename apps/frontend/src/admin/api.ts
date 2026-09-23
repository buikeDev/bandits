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
  (
    ({
      AWAITING_WHATSAPP: 'New order',
      CONFIRMED: 'Accepted',
      IN_PRODUCTION: 'Processing',
      DISPATCHED: 'On route',
      PAID: 'Payment confirmed',
      UNPAID: 'Awaiting payment',
      PART_PAID: 'Partially paid',
    }) as Record<string, string>
  )[value] ?? value.toLowerCase().replace(/_/g, ' ');
export const fulfilmentLabel = (status: string, method?: string) => {
  if (status === 'READY')
    return method === 'COLLECTION' ? 'Ready for pickup' : 'Ready for dispatch';
  if (status === 'COMPLETED')
    return method === 'COLLECTION'
      ? 'Collected'
      : method === 'DELIVERY'
        ? 'Delivered'
        : 'Completed';
  return label(status);
};
export const inputClass =
  'mt-1 block min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm';
export const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50';
