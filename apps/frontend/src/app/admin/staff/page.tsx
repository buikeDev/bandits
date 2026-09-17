'use client';
import { useState } from 'react';
import { useAdminData } from '@/admin/useAdminData';
import { useStaff } from '@/admin/AdminShell';
import { adminApi, inputClass, buttonClass } from '@/admin/api';
import type { Staff } from '@/admin/types';
export default function StaffPage() {
  const actor = useStaff();
  const { data, error, refresh } = useAdminData<Staff[]>('/staff');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const save = async (path: string, body: unknown, method = 'POST') => {
    setBusy(true);
    setFailure('');
    try {
      await adminApi(path, body, method);
      refresh();
    } catch (cause) {
      setFailure((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (actor?.role !== 'ADMIN') return <p>Administrator access required.</p>;
  return (
    <main>
      <h1 className="text-3xl font-bold">Staff access</h1>
      <p className="mt-2 text-neutral-600">
        Admins manage staff and catalogue. Staff manage order operations.
      </p>
      {(error || failure) && (
        <p role="alert" className="my-4 text-red-700">
          {error || failure}
        </p>
      )}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">Team</h2>
          {!data && !error && <p role="status">Loading staff…</p>}
          {error && (
            <button className={buttonClass} onClick={refresh}>
              Retry
            </button>
          )}
          {data?.map((staff) => (
            <form
              key={`${staff.id}-${staff.role}-${staff.isActive}`}
              className="space-y-3 border-t pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void save(
                  `/staff/${staff.id}`,
                  { role: form.get('role'), isActive: form.get('active') === 'on' },
                  'PATCH'
                );
              }}
            >
              <p className="font-semibold">
                {staff.name}
                {actor?.id === staff.id ? ' (you)' : ''}
              </p>
              <p className="break-all text-sm text-neutral-600">{staff.email}</p>
              <label className="block text-sm">
                Role
                <select
                  name="role"
                  defaultValue={staff.role}
                  disabled={staff.id === actor?.id}
                  className={inputClass}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={staff.isActive}
                  disabled={staff.id === actor?.id}
                />
                Active account
              </label>
              <button disabled={busy || staff.id === actor?.id} className={buttonClass}>
                Update access
              </button>
            </form>
          ))}
        </section>
        <form
          className="space-y-4 rounded-xl border bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const values = Object.fromEntries(new FormData(form));
            await save('/staff', values);
            (form.elements.namedItem('password') as HTMLInputElement).value = '';
          }}
        >
          <h2 className="text-lg font-bold">Create staff account</h2>
          <label className="block text-sm">
            Full name
            <input name="name" required minLength={2} maxLength={100} className={inputClass} />
          </label>
          <label className="block text-sm">
            Email
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="block text-sm">
            Initial password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Role
            <select name="role" className={inputClass}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </label>
          <p className="text-xs text-neutral-600">
            Share credentials privately. Access changes revoke existing sessions.
          </p>
          <button disabled={busy} className={buttonClass}>
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}
