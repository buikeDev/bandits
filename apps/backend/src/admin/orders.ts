import type { Prisma } from '@bandit/database';
import { AppError } from '../errors/app-error.js';
import type { OrderLine } from '../orders/schema.js';
import type { Staff } from './auth.js';
import { actionSchema, paymentState, transitions } from './schema.js';

import { adminRepository, workflowInclude } from './repository.js';
export const jsonSafe = <T>(value: T): unknown =>
  JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)));
export function snapshotLines(snapshot: Prisma.JsonValue): OrderLine[] {
  return (snapshot as unknown as { items: OrderLine[] }).items;
}
const conflict = () =>
  new AppError('This record changed. Refresh before saving again.', 409, 'CONFLICT');
export async function orderDetail(reference: string, customerId?: string) {
  const row = await adminRepository.detail({ reference, ...(customerId ? { customerId } : {}) });
  if (!row) throw new AppError('Order not found', 404, 'NOT_FOUND');
  const workflow = row.workflow;
  const quote = workflow?.quotes.find((q) => q.id === workflow.acceptedQuoteId);
  const payment = paymentState(quote?.totalMinor ?? null, workflow?.payments ?? []);
  const common = {
    reference: row.reference,
    status: row.status,
    createdAt: row.createdAt,
    snapshot: row.snapshot,
    totalQuantity: row.totalQuantity,
    subtotalMinor: row.subtotalMinor,
    quoteRequired: row.quoteRequired,
    ...payment,
  };
  if (customerId)
    return jsonSafe({
      ...common,
      quote: quote
        ? {
            lines: quote.lines,
            printingMinor: quote.printingMinor,
            deliveryMinor: quote.deliveryMinor,
            totalMinor: quote.totalMinor,
          }
        : null,
      deliveryMethod: workflow?.deliveryMethod,
      tracking: workflow?.tracking,
    });
  return jsonSafe({ ...common, message: row.message, customer: row.customer, workflow });
}

export async function updateOrder(reference: string, input: unknown, staff: Staff) {
  const action = actionSchema.parse(input);
  try {
    await adminRepository.transaction(async (tx) => {
      const order = await tx.orderEnquiry.findUnique({ where: { reference } });
      if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
      const workflow = await tx.orderWorkflow.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id },
        update: {},
        include: workflowInclude,
      });
      const locked = await tx.orderWorkflow.updateMany({
        where: { id: workflow.id, version: action.version },
        data: { version: { increment: 1 } },
      });
      if (!locked.count) throw conflict();
      const items = snapshotLines(order.snapshot);
      let note = '';
      if (action.action === 'note') note = action.note;
      if (action.action === 'contact') {
        if (['DISPATCHED', 'COMPLETED', 'CANCELLED'].includes(order.status))
          throw new AppError('Delivery details are locked for this order', 409, 'LOCKED');
        const { action: _action, version: _version, ...data } = action;
        await tx.orderWorkflow.update({ where: { id: workflow.id }, data });
        note = 'Contact and delivery details updated';
      }
      if (action.action === 'quote') {
        if (workflow.acceptedQuoteId || order.status !== 'AWAITING_WHATSAPP')
          throw new AppError(
            'Accepted quotes are locked. Create revisions before acceptance.',
            409,
            'LOCKED'
          );
        if (action.lines.length !== items.length)
          throw new AppError('Price every order line', 400, 'INVALID_QUOTE');
        const lines = items.map((item, i) => ({
          name: item.name,
          quantity: item.quantity,
          unitMinor: action.lines[i].unitMinor,
          totalMinor: action.lines[i].unitMinor * item.quantity,
        }));
        const total = lines.reduce(
          (sum, line) => sum + BigInt(line.unitMinor) * BigInt(line.quantity),
          BigInt(action.printingMinor) + BigInt(action.deliveryMinor)
        );
        if (
          total > BigInt(Number.MAX_SAFE_INTEGER) ||
          lines.some((l) => !Number.isSafeInteger(l.totalMinor))
        )
          throw new AppError('Quote total is too large', 400, 'INVALID_QUOTE');
        await tx.orderQuote.create({
          data: {
            workflowId: workflow.id,
            lines,
            printingMinor: action.printingMinor,
            deliveryMinor: action.deliveryMinor,
            totalMinor: total,
            note: action.note,
            staffId: staff.id,
          },
        });
        note = `Quote prepared. ${action.note}`;
      }
      if (action.action === 'acceptQuote') {
        if (
          workflow.acceptedQuoteId ||
          order.status !== 'AWAITING_WHATSAPP' ||
          workflow.quotes[0]?.id !== action.quoteId
        )
          throw new AppError(
            'Only the latest unaccepted quote can be accepted',
            409,
            'INVALID_QUOTE'
          );
        await tx.orderWorkflow.update({
          where: { id: workflow.id },
          data: { acceptedQuoteId: action.quoteId },
        });
        note = `Customer accepted quote: ${action.note}`;
      }
      if (action.action === 'payment') {
        const quote = workflow.quotes.find((q) => q.id === workflow.acceptedQuoteId);
        if (!quote)
          throw new AppError('Accept a quote before recording payment', 409, 'QUOTE_REQUIRED');
        if (action.kind === 'PAYMENT' && order.status === 'CANCELLED')
          throw new AppError('Cancelled orders cannot receive payments', 409, 'LOCKED');
        const paid = BigInt(paymentState(quote.totalMinor, workflow.payments).paidMinor);
        if (
          (action.kind === 'REFUND' && BigInt(action.amountMinor) > paid) ||
          (action.kind === 'PAYMENT' && paid + BigInt(action.amountMinor) > quote.totalMinor)
        )
          throw new AppError(
            'Amount exceeds the refundable balance or amount due',
            400,
            'INVALID_PAYMENT'
          );
        await tx.orderPayment.create({
          data: {
            workflowId: workflow.id,
            staffId: staff.id,
            amountMinor: action.amountMinor,
            kind: action.kind,
            reference: action.reference,
          },
        });
        note = `${action.kind}: ${action.amountMinor / 100} NGN. Reference: ${action.reference}`;
      }
      if (action.action === 'status') {
        if (!transitions[order.status]?.includes(action.status))
          throw new AppError('This status transition is not allowed', 409, 'INVALID_STATUS');
        if (action.status === 'CONFIRMED') {
          if (!workflow.acceptedQuoteId)
            throw new AppError('Prepare and accept the final quote first', 409, 'QUOTE_REQUIRED');
          if (
            !workflow.contactName ||
            !workflow.contactPhone ||
            (workflow.deliveryMethod === 'DELIVERY' && !workflow.deliveryAddress)
          )
            throw new AppError(
              'Complete contact and delivery details first',
              409,
              'CONTACT_REQUIRED'
            );
          const quantities = new Map<string, number>();
          for (const item of items)
            if (item.product && !item.requestedColor)
              quantities.set(
                item.product.variantId,
                (quantities.get(item.product.variantId) ?? 0) + item.quantity
              );
          for (const [variantId, quantity] of quantities) {
            const inventory = await tx.inventory.findUnique({
              where: { variantId },
              include: { variant: { include: { product: true } } },
            });
            if (
              !inventory ||
              !inventory.variant.isActive ||
              !inventory.variant.product.isActive ||
              inventory.quantity - inventory.reservedQuantity < quantity
            )
              throw new AppError(
                'Insufficient or inactive stock. Check inventory before confirming.',
                409,
                'INSUFFICIENT_STOCK'
              );
            const changed = await tx.inventory.updateMany({
              where: {
                id: inventory.id,
                quantity: inventory.quantity,
                reservedQuantity: inventory.reservedQuantity,
              },
              data: { reservedQuantity: { increment: quantity } },
            });
            if (!changed.count) throw conflict();
            await tx.stockReservation.create({
              data: { workflowId: workflow.id, variantId, quantity },
            });
          }
        }
        if (
          action.status === 'DISPATCHED' &&
          (workflow.deliveryMethod !== 'DELIVERY' || !workflow.tracking)
        )
          throw new AppError('Add delivery tracking before dispatch', 409, 'TRACKING_REQUIRED');
        if (action.status === 'COMPLETED') {
          if (order.status === 'READY' && workflow.deliveryMethod !== 'COLLECTION')
            throw new AppError(
              'Dispatch delivery orders before completing them',
              409,
              'INVALID_STATUS'
            );
          const quote = workflow.quotes.find((q) => q.id === workflow.acceptedQuoteId);
          if (
            paymentState(quote?.totalMinor ?? null, workflow.payments).paymentStatus !== 'PAID' &&
            quote?.totalMinor !== 0n
          )
            throw new AppError('Record full payment before completion', 409, 'PAYMENT_REQUIRED');
        }
        if (['CANCELLED', 'DISPATCHED', 'COMPLETED'].includes(action.status)) {
          for (const reservation of workflow.reservations.filter((r) => r.state === 'RESERVED')) {
            const changed = await tx.inventory.updateMany({
              where: {
                variantId: reservation.variantId,
                reservedQuantity: { gte: reservation.quantity },
                quantity: { gte: reservation.quantity },
              },
              data: {
                reservedQuantity: { decrement: reservation.quantity },
                ...(action.status === 'CANCELLED'
                  ? {}
                  : { quantity: { decrement: reservation.quantity } }),
              },
            });
            if (!changed.count) throw conflict();
            await tx.stockReservation.update({
              where: { id: reservation.id },
              data: { state: action.status === 'CANCELLED' ? 'RELEASED' : 'CONSUMED' },
            });
          }
        }
        await tx.orderEnquiry.update({
          where: { id: order.id },
          data: { status: action.status },
        });
        note = `${order.status} → ${action.status}: ${action.note}`;
      }
      await tx.orderEvent.create({
        data: {
          workflowId: workflow.id,
          staffId: staff.id,
          staffName: staff.name,
          action: action.action,
          note,
        },
      });
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2034') throw conflict();
    if (code === 'P2002')
      throw new AppError(
        'This action or payment reference already exists. Refresh the order.',
        409,
        'DUPLICATE'
      );
    throw error;
  }
  return orderDetail(reference);
}
