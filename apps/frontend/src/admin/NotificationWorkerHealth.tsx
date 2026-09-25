'use client';

import { useAdminData } from './useAdminData';

type WorkerStatus = {
  enabled: boolean;
  status: 'DISABLED' | 'NOT_STARTED' | 'HEALTHY' | 'STALE';
  lastSeenAt: string | null;
  lastError: string | null;
};

const copy: Record<WorkerStatus['status'], { title: string; detail: string; tone: string }> = {
  DISABLED: {
    title: 'Email notifications are disabled',
    detail: 'No customer email will be sent until the worker and Resend sender are configured.',
    tone: 'bg-slate-100 text-slate-700',
  },
  NOT_STARTED: {
    title: 'Notification worker has not started',
    detail: 'Deploy or restart the persistent notification worker before enabling email.',
    tone: 'bg-red-50 text-red-800',
  },
  HEALTHY: {
    title: 'Notification worker is healthy',
    detail: 'It is polling the outbox and delivery status.',
    tone: 'bg-emerald-50 text-emerald-800',
  },
  STALE: {
    title: 'Notification worker needs attention',
    detail: 'Its heartbeat is older than 90 seconds. Check the worker deployment and logs.',
    tone: 'bg-amber-50 text-amber-900',
  },
};

export default function NotificationWorkerHealth() {
  const { data, error, refresh } = useAdminData<WorkerStatus>('/notifications/worker');
  if (error)
    return (
      <section className="admin-panel mt-4 text-sm" role="alert">
        Notification worker status is unavailable.{' '}
        <button className="underline" onClick={refresh}>Retry</button>
      </section>
    );
  if (!data) return null;
  const state = copy[data.status];
  return (
    <section className={`admin-panel mt-4 text-sm ${state.tone}`} role="status">
      <p className="font-bold">{state.title}</p>
      <p className="mt-1 text-xs leading-5">{data.lastError || state.detail}</p>
      {data.lastSeenAt && (
        <p className="mt-2 text-xs">Last heartbeat: {new Date(data.lastSeenAt).toLocaleString()}</p>
      )}
    </section>
  );
}
