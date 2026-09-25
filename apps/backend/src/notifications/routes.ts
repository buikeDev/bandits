import { Router } from 'express';
import { prisma } from '@bandit/database';
import { z } from 'zod';
import { currentStaff } from '../admin/auth.js';
import { AppError } from '../errors/app-error.js';
import { customerUpdate, whatsappPhone } from './messages.js';
import { notificationsEnabled } from './queue.js';
import { notificationWorkerStatus } from './heartbeat.js';

export const notificationRoutes: ReturnType<typeof Router> = Router();
export const notificationWorkerRoutes: ReturnType<typeof Router> = Router();
notificationWorkerRoutes.get('/worker', async (_req, res, next) => {
  try {
    await currentStaff(_req);
    res.json({ success: true, data: await notificationWorkerStatus() });
  } catch (error) {
    next(error);
  }
});
notificationRoutes.get('/:reference/notifications', async (req, res, next) => {
  try {
    await currentStaff(req);
    const order = await prisma.orderEnquiry.findUnique({
      where: { reference: req.params.reference },
      include: { workflow: true, customer: true },
    });
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    res.json({
      success: true,
      data: {
        enabled: notificationsEnabled(),
        email:
          order.workflow?.notificationEmail ||
          (order.customer?.supabaseAuthId ? order.customer.email : ''),
        items: notificationsEnabled()
          ? await prisma.orderNotification.findMany({
              where: { reference: order.reference },
              orderBy: { createdAt: 'desc' },
              take: 50,
              select: {
                id: true,
                kind: true,
                recipient: true,
                status: true,
                attempts: true,
                lastError: true,
                createdAt: true,
              },
            })
          : [],
      },
    });
  } catch (error) {
    next(error);
  }
});
notificationRoutes.post('/:reference/notifications/whatsapp', async (req, res, next) => {
  try {
    const staff = await currentStaff(req);
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orderEnquiry.findUnique({
        where: { reference: req.params.reference },
        include: { workflow: true },
      });
      if (!order?.workflow)
        throw new AppError('Save contact details first', 409, 'CONTACT_REQUIRED');
      const phone = whatsappPhone(order.workflow.contactPhone);
      if (!phone)
        throw new AppError('Save a valid international phone number first', 400, 'INVALID_PHONE');
      const text = customerUpdate(
        order.reference,
        order.status,
        order.workflow.deliveryMethod,
        order.workflow.tracking
      );
      await tx.orderEvent.create({
        data: {
          workflowId: order.workflow.id,
          staffId: staff.id,
          staffName: staff.name,
          action: 'whatsapp',
          note: `WhatsApp update prepared for ${order.status}; sending and delivery are not confirmed.`,
        },
      });
      return { url: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`, message: text };
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
notificationRoutes.post('/:reference/notifications/email', async (req, res, next) => {
  try {
    const staff = await currentStaff(req);
    const { email } = z
      .object({ email: z.union([z.literal(''), z.string().trim().email().max(254)]) })
      .parse(req.body);
    await prisma.$transaction(async (tx) => {
      const order = await tx.orderEnquiry.findUnique({
        where: { reference: req.params.reference },
      });
      if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
      const workflow = await tx.orderWorkflow.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, notificationEmail: email },
        update: { notificationEmail: email, version: { increment: 1 } },
      });
      await tx.orderEvent.create({
        data: {
          workflowId: workflow.id,
          staffId: staff.id,
          staffName: staff.name,
          action: 'notification_email',
          note: 'Notification email updated for future events; queued messages are unchanged.',
        },
      });
    });
    res.json({ success: true, data: { ok: true } });
  } catch (error) {
    next(error);
  }
});
notificationRoutes.post('/:reference/notifications/:id/retry', async (req, res, next) => {
  try {
    const staff = await currentStaff(req);
    await prisma.$transaction(async (tx) => {
      const row = await tx.orderNotification.findFirst({
        where: {
          id: req.params.id,
          reference: req.params.reference,
          status: 'FAILED',
          providerId: null,
          firstAttemptAt: { gt: new Date(Date.now() - 23 * 3600000) },
        },
      });
      if (!row)
        throw new AppError(
          'This notification cannot be safely retried. Check its provider history.',
          409,
          'RETRY_UNAVAILABLE'
        );
      const changed = await tx.orderNotification.updateMany({
        where: { id: row.id, status: 'FAILED' },
        data: { status: 'PENDING', availableAt: new Date(), attempts: 0 },
      });
      if (!changed.count) throw new AppError('Already retried', 409, 'CONFLICT');
      const workflow = await tx.orderWorkflow.findUnique({
        where: {
          orderId: (
            await tx.orderEnquiry.findUniqueOrThrow({ where: { reference: row.reference } })
          ).id,
        },
      });
      if (workflow)
        await tx.orderEvent.create({
          data: {
            workflowId: workflow.id,
            staffId: staff.id,
            staffName: staff.name,
            action: 'notification_retry',
            note: `Retry requested for ${row.kind}.`,
          },
        });
    });
    res.json({ success: true, data: { ok: true } });
  } catch (error) {
    next(error);
  }
});
