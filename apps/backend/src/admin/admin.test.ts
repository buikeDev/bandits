import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { adminRepository } from './repository.js';
import { prisma } from '@bandit/database';
import type { Request } from 'express';
import { currentStaff, requireAdmin, type Staff } from './auth.js';
import { orderDetail, updateOrder } from './orders.js';
import { paymentState } from './schema.js';
import { createApp } from '../app.js';

const staff: Staff = {
  id: 'staff1',
  name: 'Operator',
  email: 'operator@example.test',
  role: 'STAFF',
};
afterEach(() => mock.restoreAll());
const hasCode = (code: string) => (error: unknown) => (error as { code?: string }).code === code;
test('generated Prisma client exposes the operational models', () => {
  assert.equal(typeof prisma.staffSession.findUnique, 'function');
  assert.equal(typeof prisma.orderWorkflow.findUnique, 'function');
  assert.equal(typeof prisma.orderPayment.create, 'function');
});

test('customer cookies do not grant staff access', async () => {
  await assert.rejects(
    currentStaff({ headers: { cookie: 'bandit_customer_session=customer-token' } } as Request),
    hasCode('UNAUTHENTICATED')
  );
  assert.throws(() => requireAdmin(staff), hasCode('FORBIDDEN'));
});
test('inactive or expired staff sessions are refused', async () => {
  mock.method(adminRepository, 'session', async () => ({
    expiresAt: new Date(Date.now() + 100000),
    staff: { ...staff, isActive: false },
  }));
  await assert.rejects(
    currentStaff({ headers: { cookie: 'bandit_staff_session=token' } } as Request),
    hasCode('UNAUTHENTICATED')
  );
  mock.restoreAll();
  mock.method(adminRepository, 'session', async () => ({
    expiresAt: new Date(0),
    staff: { ...staff, isActive: true },
  }));
  await assert.rejects(
    currentStaff({ headers: { cookie: 'bandit_staff_session=token' } } as Request),
    hasCode('UNAUTHENTICATED')
  );
});
test('protected HTTP endpoints reject unauthenticated reads and form writes', async () => {
  const server = createApp({ checkDatabase: async () => {} }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as { port: number };
  try {
    const origin = `http://127.0.0.1:${address.port}`;
    assert.equal((await fetch(`${origin}/api/admin/orders`)).status, 401);
    assert.equal(
      (
        await fetch(`${origin}/api/admin/orders/reference/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
      ).status,
      403
    );
    assert.equal((await fetch(`${origin}/api/orders/mine/reference`)).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
test('customer detail lookup includes ownership and hides internal records', async () => {
  let filter: unknown;
  mock.method(adminRepository, 'detail', async (query: unknown) => {
    filter = query;
    return {
      reference: 'ref',
      status: 'CONFIRMED',
      customer: { name: 'Private', email: 'private@example.test' },
      message: 'private message',
      snapshot: { items: [] },
      subtotalMinor: 500n,
      workflow: {
        quotes: [],
        acceptedQuoteId: null,
        payments: [],
        events: [{ note: 'staff secret' }],
        deliveryMethod: 'COLLECTION',
        tracking: '',
      },
    };
  });
  const result = (await orderDetail('ref', 'customer1')) as Record<string, unknown>;
  assert.deepEqual(filter, { reference: 'ref', customerId: 'customer1' });
  assert.equal(result.workflow, undefined);
  assert.equal(result.message, undefined);
  assert.equal(result.customer, undefined);
  assert.equal(result.subtotalMinor, '500');
});

test('ordinary staff cannot read or mutate catalogue, stock or staff accounts', async () => {
  mock.method(adminRepository, 'session', async () => ({
    expiresAt: new Date(Date.now() + 100000),
    staff: { ...staff, isActive: true },
  }));
  const server = createApp({ checkDatabase: async () => {} }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}/api/admin`;
  const headers = {
    Cookie: 'bandit_staff_session=test',
    'X-Bandit-Admin': '1',
    'Content-Type': 'application/json',
  };
  try {
    for (const path of ['/products', '/staff', '/settings', '/categories', '/inventory/v1/history'])
      assert.equal((await fetch(`${origin}${path}`, { headers })).status, 403);
    for (const [method, path] of [
      ['PATCH', '/products/p1'],
      ['PATCH', '/variants/v1'],
      ['POST', '/inventory/v1'],
      ['POST', '/staff'],
      ['POST', '/products'],
      ['POST', '/categories'],
      ['POST', '/products/p1/variants'],
      ['POST', '/images'],
      ['POST', '/inventory/v1/receive'],
      ['PATCH', '/settings'],
      ['PATCH', '/products/p1/media'],
      ['PATCH', '/variants/v1/options'],
      ['PATCH', '/inventory/v1/threshold'],
      ['PATCH', '/staff/s1'],
    ]) {
      assert.equal((await fetch(`${origin}${path}`, { method, headers, body: '{}' })).status, 403);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('other customer and missing order references return not found', async () => {
  mock.method(adminRepository, 'detail', async () => null);
  await assert.rejects(orderDetail('other-reference', 'customer1'), hasCode('NOT_FOUND'));
});

test('quote revisions price all lines and accepted quotes cannot be rewritten', async () => {
  const f = fixture();
  await assert.rejects(
    updateOrder(
      'ref',
      {
        action: 'quote',
        version: 0,
        lines: [{ unitMinor: 100 }],
        printingMinor: 0,
        deliveryMinor: 0,
        note: '',
      },
      staff
    ),
    hasCode('LOCKED')
  );
  f.workflow.acceptedQuoteId = null;
  await assert.rejects(
    updateOrder(
      'ref',
      {
        action: 'quote',
        version: 0,
        lines: [{ unitMinor: 100 }, { unitMinor: 100 }],
        printingMinor: 0,
        deliveryMinor: 0,
        note: '',
      },
      staff
    ),
    hasCode('INVALID_QUOTE')
  );
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'acceptQuote', version: 0, quoteId: 'older-quote', note: 'Agreed' },
      staff
    ),
    hasCode('INVALID_QUOTE')
  );
});

function fixture(status = 'AWAITING_WHATSAPP', quantity = 100) {
  const events: unknown[] = [];
  const inventoryChanges: unknown[] = [];
  const reservations: unknown[] = [];
  const payments: unknown[] = [];
  const preparationChanges: unknown[] = [];
  const workflow = {
    id: 'wf',
    version: 0,
    contactName: 'Buyer',
    contactPhone: '08000000000',
    deliveryAddress: '',
    deliveryMethod: 'COLLECTION',
    deliveryMinor: null as bigint | null,
    tracking: '',
    acceptedQuoteId: 'q1' as string | null,
    quotes: [{ id: 'q1', totalMinor: 10000n }],
    payments: [] as { amountMinor: bigint; kind: string }[],
    reservations: [] as { id: string; variantId: string; quantity: number; state: string }[],
  };
  const order = {
    id: 'order1',
    reference: 'ref',
    status,
    subtotalMinor: 10000n,
    snapshot: {
      version: 1,
      items: [
        {
          id: 'line',
          name: 'Tyvek',
          quantity: 10,
          requestedColor: false,
          product: { variantId: 'variant1' },
        },
      ],
    },
  };
  const tx = {
    orderEnquiry: {
      findUnique: async () => order,
      update: async ({ data }: { data: { status: string } }) => {
        order.status = data.status;
      },
    },
    orderWorkflow: {
      upsert: async () => workflow,
      updateMany: async ({ where }: { where: { version: number } }) => ({
        count: where.version === workflow.version ? 1 : 0,
      }),
      update: async () => ({}),
    },
    inventory: {
      findUnique: async () => ({
        id: 'inv',
        quantity,
        reservedQuantity: 0,
        variant: { isActive: true, product: { isActive: true } },
      }),
      updateMany: async (args: unknown) => {
        inventoryChanges.push(args);
        return { count: 1 };
      },
    },
    stockReservation: {
      create: async (args: unknown) => {
        reservations.push(args);
      },
      update: async () => ({}),
    },
    orderPreparationTask: {
      upsert: async (args: unknown) => {
        preparationChanges.push(args);
      },
    },
    orderEvent: {
      create: async (args: unknown) => {
        events.push(args);
      },
    },
    orderPayment: {
      create: async (args: unknown) => {
        payments.push(args);
      },
    },
    orderQuote: { create: async () => ({}) },
  };
  mock.method(
    adminRepository,
    'transaction',
    async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx)
  );
  mock.method(adminRepository, 'detail', async () => ({ ...order, workflow: null }));
  return {
    workflow,
    order,
    tx,
    events,
    inventoryChanges,
    reservations,
    payments,
    preparationChanges,
  };
}
test('stale order mutations are rejected before staff changes', async () => {
  const f = fixture();
  await assert.rejects(
    updateOrder('ref', { action: 'note', version: 2, note: 'Stale note' }, staff),
    hasCode('CONFLICT')
  );
  assert.equal(f.events.length, 0);
});
test('confirmation reserves available listed stock once and records the actor', async () => {
  const f = fixture();
  await updateOrder(
    'ref',
    { action: 'status', version: 0, status: 'CONFIRMED', note: 'Agreed on WhatsApp' },
    staff
  );
  assert.equal(f.order.status, 'CONFIRMED');
  assert.equal(f.reservations.length, 1);
  assert.deepEqual((f.inventoryChanges[0] as { data: unknown }).data, {
    reservedQuantity: { increment: 10 },
  });
  assert.equal((f.events[0] as { data: { staffId: string } }).data.staffId, staff.id);
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'CONFIRMED', note: 'Double click' },
      staff
    ),
    hasCode('INVALID_STATUS')
  );
  assert.equal(f.reservations.length, 1);
});
test('preparation checkpoints are saved only after confirmation and are audited', async () => {
  const f = fixture();
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'preparation', version: 0, key: 'ARTWORK_CONFIRMED', completed: true },
      staff
    ),
    hasCode('ORDER_NOT_CONFIRMED')
  );
  f.order.status = 'CONFIRMED';
  await updateOrder(
    'ref',
    { action: 'preparation', version: 0, key: 'ARTWORK_CONFIRMED', completed: true },
    staff
  );
  assert.equal(f.preparationChanges.length, 1);
  assert.equal(
    (f.preparationChanges[0] as { create: { key: string } }).create.key,
    'ARTWORK_CONFIRMED'
  );
  assert.match((f.events[0] as { data: { note: string } }).data.note, /Completed preparation task/);
});
test('acceptance reserves stock while WhatsApp contact details are still missing', async () => {
  const f = fixture();
  f.workflow.contactName = '';
  f.workflow.contactPhone = '';
  await updateOrder(
    'ref',
    { action: 'status', version: 0, status: 'CONFIRMED', note: 'Accepted on WhatsApp' },
    staff
  );
  assert.equal(f.order.status, 'CONFIRMED');
  assert.equal(f.reservations.length, 1);
});

test('dispatch requires contact details and verified full payment before consuming stock', async () => {
  const f = fixture('READY');
  f.order.snapshot.version = 2;
  f.workflow.deliveryMethod = 'DELIVERY';
  f.workflow.deliveryMinor = 500n;
  f.workflow.tracking = 'Courier reference 123';
  const action = { action: 'status', version: 0, status: 'DISPATCHED', note: 'Courier handover' };
  await assert.rejects(updateOrder('ref', action, staff), hasCode('CONTACT_REQUIRED'));
  assert.equal(f.order.status, 'READY');
  f.workflow.deliveryAddress = '10 Test Street, Lagos';
  await assert.rejects(updateOrder('ref', action, staff), hasCode('PAYMENT_REQUIRED'));
  f.workflow.payments = [{ amountMinor: 10500n, kind: 'PAYMENT' }];
  await updateOrder('ref', action, staff);
  assert.equal(f.order.status, 'DISPATCHED');
});

test('confirmation refuses insufficient stock and unaccepted quotes', async () => {
  const f = fixture('AWAITING_WHATSAPP', 5);
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'CONFIRMED', note: 'Confirm' },
      staff
    ),
    hasCode('INSUFFICIENT_STOCK')
  );
  assert.equal(f.reservations.length, 0);
  f.workflow.acceptedQuoteId = null;
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'CONFIRMED', note: 'Confirm' },
      staff
    ),
    hasCode('QUOTE_REQUIRED')
  );
});
test('cancellation releases reservations without consuming stock', async () => {
  const f = fixture('CONFIRMED');
  f.workflow.reservations = [{ id: 'r', variantId: 'variant1', quantity: 10, state: 'RESERVED' }];
  await updateOrder(
    'ref',
    { action: 'status', version: 0, status: 'CANCELLED', note: 'Customer cancelled' },
    staff
  );
  assert.deepEqual((f.inventoryChanges[0] as { data: unknown }).data, {
    reservedQuantity: { decrement: 10 },
  });
});
test('completed orders require payment and collection consumes reserved stock', async () => {
  const f = fixture('READY');
  f.workflow.reservations = [{ id: 'r', variantId: 'variant1', quantity: 10, state: 'RESERVED' }];
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'COMPLETED', note: 'Collected' },
      staff
    ),
    hasCode('PAYMENT_REQUIRED')
  );
  f.workflow.payments = [{ amountMinor: 10000n, kind: 'PAYMENT' }];
  await updateOrder(
    'ref',
    { action: 'status', version: 0, status: 'COMPLETED', note: 'Collected' },
    staff
  );
  assert.deepEqual((f.inventoryChanges[0] as { data: unknown }).data, {
    reservedQuantity: { decrement: 10 },
    quantity: { decrement: 10 },
  });
});
test('refunds cannot exceed receipts and overpayments are rejected', async () => {
  const f = fixture('CONFIRMED');
  f.workflow.payments = [{ amountMinor: 5000n, kind: 'PAYMENT' }];
  for (const kind of ['PAYMENT', 'REFUND'])
    await assert.rejects(
      updateOrder(
        'ref',
        {
          action: 'payment',
          version: 0,
          kind,
          amountMinor: 6000,
          reference: 'BANK-001',
          reason: kind === 'REFUND' ? 'Customer cancellation' : '',
        },
        kind === 'REFUND' ? { ...staff, role: 'ADMIN' } : staff
      ),
      hasCode('INVALID_PAYMENT')
    );
  assert.equal(f.payments.length, 0);
  assert.equal(paymentState(10000n, f.workflow.payments).paymentStatus, 'PART_PAID');
});
test('duplicate payment references return a conflict', async () => {
  const f = fixture('CONFIRMED');
  mock.method(f.tx.orderPayment, 'create', async () => {
    throw Object.assign(new Error('unique'), { code: 'P2002' });
  });
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'payment', version: 0, kind: 'PAYMENT', amountMinor: 1000, reference: 'BANK-001' },
      staff
    ),
    hasCode('DUPLICATE')
  );
});

test('calculated orders confirm and take payments without quotes', async () => {
  const f = fixture();
  f.order.snapshot.version = 2;
  f.workflow.acceptedQuoteId = null;
  f.workflow.quotes = [];
  await updateOrder(
    'ref',
    { action: 'status', version: 0, status: 'CONFIRMED', note: 'Artwork checked' },
    staff
  );
  assert.equal(f.reservations.length, 1);
  await updateOrder(
    'ref',
    {
      action: 'payment',
      version: 0,
      amountMinor: 10000,
      kind: 'PAYMENT',
      reference: 'receipt-new',
    },
    staff
  );
  assert.equal(f.payments.length, 1);
});
test('calculated order item prices cannot be overwritten by quotes', async () => {
  const f = fixture();
  f.order.snapshot.version = 2;
  f.workflow.acceptedQuoteId = null;
  await assert.rejects(
    updateOrder(
      'ref',
      {
        action: 'quote',
        version: 0,
        lines: [{ unitMinor: 1 }],
        printingMinor: 0,
        deliveryMinor: 0,
        note: '',
      },
      staff
    ),
    hasCode('CALCULATED_ORDER')
  );
});

test('calculated delivery orders require a confirmed delivery charge before completion', async () => {
  const f = fixture('DISPATCHED');
  f.order.snapshot.version = 2;
  f.workflow.acceptedQuoteId = null;
  f.workflow.deliveryMethod = 'DELIVERY';
  f.workflow.payments = [{ amountMinor: 10000n, kind: 'PAYMENT' }];
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'COMPLETED', note: 'Delivered' },
      staff
    ),
    hasCode('DELIVERY_REQUIRED')
  );
  f.workflow.deliveryMinor = 500n;
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'COMPLETED', note: 'Delivered' },
      staff
    ),
    hasCode('PAYMENT_REQUIRED')
  );
  f.workflow.payments.push({ amountMinor: 500n, kind: 'PAYMENT' });
  await updateOrder(
    'ref',
    { action: 'status', version: 0, status: 'COMPLETED', note: 'Delivered' },
    staff
  );
  assert.equal(f.order.status, 'COMPLETED');
});

test('calculated orders cannot dispatch with an unknown delivery fee', async () => {
  const f = fixture('READY');
  f.order.snapshot.version = 2;
  f.workflow.deliveryMethod = 'DELIVERY';
  f.workflow.tracking = 'Courier tracking 12';
  await assert.rejects(
    updateOrder(
      'ref',
      { action: 'status', version: 0, status: 'DISPATCHED', note: 'Handed over' },
      staff
    ),
    hasCode('DELIVERY_REQUIRED')
  );
  assert.equal(f.order.status, 'READY');
});
