type ErrorEvent = {
  code?: string;
  errorName: string;
  method: string;
  path: string;
  requestId?: string;
  status: number;
};

export function logApiError(event: ErrorEvent): void {
  // Keep logs useful for incident response without recording request bodies,
  // query values, customer artwork, payment data or provider credentials.
  console.error(
    JSON.stringify({
      event: 'api_error',
      time: new Date().toISOString(),
      ...event,
    })
  );
}
