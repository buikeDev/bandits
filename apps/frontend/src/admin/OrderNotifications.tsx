'use client';
import { useState } from 'react';
import { adminApi, buttonClass, inputClass, label } from './api';
import { useAdminData } from './useAdminData';

type History = {
  enabled: boolean;
  email: string;
  items: {
    id: string;
    kind: string;
    recipient: string;
    status: string;
    attempts: number;
    lastError: string | null;
    createdAt: string;
  }[];
};
export default function OrderNotifications({
  reference,
  version,
}: {
  reference: string;
  version: number;
}) {
  const path = `/orders/${encodeURIComponent(reference)}/notifications`;
  const { data, error, refresh } = useAdminData<History>(path);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  async function action(suffix: string, body: unknown) {
    setBusy(true);
    setNotice('');
    try {
      const result = await adminApi<{ url?: string }>(`${path}/${suffix}`, body);
      if (result.url) {
        setWhatsapp(result.url);
        setNotice(
          'Update prepared. Open WhatsApp below, review the message and tap Send. Delivery is not confirmed here.'
        );
      } else {
        setNotice('Saved.');
        refresh();
      }
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-bold">Customer updates</h2>
      <p className="text-sm text-neutral-600">
        Use the saved contact phone to prepare an update about the current order status.
      </p>
      <button
        type="button"
        disabled={busy}
        className={buttonClass}
        onClick={() => void action('whatsapp', {})}
      >
        Prepare WhatsApp update
      </button>
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center px-3 underline"
        >
          Open WhatsApp to review and send
        </a>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Unable to load notification history.{' '}
          <button onClick={refresh} className="underline">
            Retry
          </button>
        </p>
      )}
      {data && (
        <>
          {!data.enabled && (
            <p className="rounded bg-amber-50 p-3 text-sm">
              Automatic email is not enabled. Staff can use WhatsApp updates.
            </p>
          )}
          <form
            key={`${version}-${data.email}`}
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void action('email', { email: new FormData(event.currentTarget).get('email') });
            }}
          >
            <label className="block text-sm">
              Notification email (optional)
              <input
                name="email"
                type="email"
                maxLength={254}
                defaultValue={data.email}
                className={inputClass}
              />
            </label>
            <p className="text-xs text-neutral-600">
              Confirm this address with the customer. It receives future order updates, not
              newsletters. Existing queued messages keep their original recipient.
            </p>
            <button disabled={busy} className={buttonClass}>
              Save notification email
            </button>
          </form>
          <h3 className="font-semibold">Email history</h3>
          {!data.items.length && (
            <p className="text-sm text-neutral-600">No email notifications recorded.</p>
          )}
          <ul className="divide-y">
            {data.items.map((item) => (
              <li key={item.id} className="space-y-2 py-3 text-sm">
                <p>
                  {label(item.kind)} · {label(item.status)}
                </p>
                <p className="break-all text-xs text-neutral-600">
                  {item.recipient || 'No notification email recorded'} ·{' '}
                  {new Date(item.createdAt).toLocaleString()} · {item.attempts} attempts
                </p>
                {item.lastError && <p className="text-xs text-amber-800">{item.lastError}</p>}
                {item.status === 'FAILED' && (
                  <button
                    disabled={busy}
                    className="min-h-11 underline"
                    onClick={() => void action(`${item.id}/retry`, {})}
                  >
                    Retry email
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-neutral-600">
            Accepted means the email provider accepted the message. Delivered means the recipient’s
            mail server accepted it, not that the customer read it.
          </p>
        </>
      )}
    </section>
  );
}
