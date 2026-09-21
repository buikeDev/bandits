import { catalogueAdmin } from './catalogue.js';
import { listCatalogue, catalogueRepository } from './catalogue-list.js';
import {
  Router,
  type Router as ExpressRouter,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { prisma } from '@bandit/database';
import { z } from 'zod';
import { wristbandColorSchema } from '@bandit/shared';
import { AppError } from '../errors/app-error.js';
import { hashPassword, verifyPassword } from '../customer-auth/password.js';
import {
  currentStaff,
  limitLogin,
  loginStaff,
  logoutStaff,
  protectWrite,
  publicStaff,
  requireAdmin,
} from './auth.js';
import { jsonSafe, orderDetail, updateOrder } from './orders.js';
import { statuses } from './schema.js';
import { insights } from './insights.js';

export const adminRouter: ExpressRouter = Router();
const route =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res)
      .then((data) => {
        if (!res.headersSent) res.json({ success: true, data: jsonSafe(data) });
      })
      .catch(next);
  };
adminRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
adminRouter.use(protectWrite);
adminRouter.get(
  '/insights',
  route(async (req) => {
    const staff = await currentStaff(req);
    const days = z.coerce
      .number()
      .refine((value) => value === 7 || value === 30)
      .default(7)
      .parse(req.query.days);
    return insights(days, staff.role === 'ADMIN');
  })
);
adminRouter.post(
  '/login',
  limitLogin,
  route(async (req, res) => {
    const input = z
      .object({
        email: z
          .string()
          .trim()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        password: z.string().min(1).max(128),
      })
      .parse(req.body);
    return loginStaff(input.email, input.password, res);
  })
);
adminRouter.post(
  '/logout',
  route(async (req, res) => {
    await logoutStaff(req, res);
    return { ok: true };
  })
);
adminRouter.get(
  '/me',
  route((req) => currentStaff(req))
);
adminRouter.post(
  '/password',
  limitLogin,
  route(async (req, res) => {
    const actor = await currentStaff(req);
    const input = z
      .object({
        currentPassword: z.string().min(1).max(128),
        password: z.string().min(12).max(128),
      })
      .parse(req.body);
    const account = await prisma.staffAccount.findUnique({ where: { id: actor.id } });
    if (!account || !(await verifyPassword(input.currentPassword, account.passwordHash)))
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    const passwordHash = await hashPassword(input.password);
    await prisma.$transaction(async (tx) => {
      const changed = await tx.staffAccount.updateMany({
        where: { id: actor.id, passwordHash: account.passwordHash, isActive: true },
        data: { passwordHash },
      });
      if (!changed.count) throw new AppError('Account changed. Sign in again.', 409, 'CONFLICT');
      await tx.staffSession.deleteMany({ where: { staffId: actor.id } });
      await tx.adminAudit.create({
        data: { staffId: actor.id, action: 'PASSWORD_CHANGED', targetId: actor.id, details: {} },
      });
    });
    return loginStaff(actor.email, input.password, res);
  })
);
adminRouter.get(
  '/overview',
  route(async (req) => {
    await currentStaff(req);
    const [counts, payments, inventory, needsQuote, balances] = await Promise.all([
      prisma.orderEnquiry.groupBy({ by: ['status'], _count: true }),
      prisma.orderPayment.groupBy({ by: ['kind'], _sum: { amountMinor: true } }),
      prisma.inventory.findMany({
        where: { variant: { isActive: true, product: { isActive: true } } },
        select: { quantity: true, reservedQuantity: true, lowStockThreshold: true },
      }),
      prisma.orderEnquiry.count({
        where: {
          status: 'AWAITING_WHATSAPP',
        },
      }),
      prisma.$queryRaw<Array<{ outstandingMinor: string }>>`
        SELECT COALESCE(SUM(GREATEST((CASE WHEN e.snapshot->>'version' = '2' THEN e."subtotalMinor" + CASE WHEN w."deliveryMethod" = 'COLLECTION' THEN 0 ELSE COALESCE(w."deliveryMinor", 0) END ELSE q."totalMinor" END) - COALESCE(p.paid, 0), 0)), 0)::text AS "outstandingMinor"
        FROM "OrderEnquiry" e
        LEFT JOIN "OrderWorkflow" w ON e.id = w."orderId"
        LEFT JOIN "OrderQuote" q ON q.id = w."acceptedQuoteId"
        LEFT JOIN (
          SELECT "workflowId", SUM(CASE WHEN kind = 'PAYMENT' THEN "amountMinor" ELSE -"amountMinor" END) AS paid
          FROM "OrderPayment" GROUP BY "workflowId"
        ) p ON p."workflowId" = w.id
        WHERE e.status <> 'CANCELLED' AND (e.snapshot->>'version' = '2' OR q.id IS NOT NULL)
      `,
    ]);
    return {
      counts,
      payments,
      needsQuote,
      outstandingMinor: balances[0]?.outstandingMinor ?? '0',
      lowStock: inventory.filter((i) => i.quantity - i.reservedQuantity <= i.lowStockThreshold)
        .length,
    };
  })
);
adminRouter.get(
  '/orders',
  route(async (req) => {
    await currentStaff(req);
    const query = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        search: z.string().trim().max(150).default(''),
        status: z.enum(statuses).optional(),
        custom: z.enum(['true']).optional(),
        from: z.string().date().optional(),
        to: z.string().date().optional(),
      })
      .parse(req.query);
    const rows = await prisma.orderEnquiry.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.custom ? { quoteRequired: true } : {}),
        ...(query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lt: new Date(new Date(query.to).getTime() + 86400000) } : {}),
              },
            }
          : {}),
        OR: [
          { reference: { contains: query.search, mode: 'insensitive' } },
          { customer: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 21,
      skip: (query.page - 1) * 20,
      select: {
        reference: true,
        status: true,
        totalQuantity: true,
        subtotalMinor: true,
        quoteRequired: true,
        createdAt: true,
        customer: { select: { name: true, email: true } },
      },
    });
    return { items: rows.slice(0, 20), hasMore: rows.length > 20, page: query.page };
  })
);
adminRouter.get(
  '/orders/:reference',
  route(async (req) => {
    await currentStaff(req);
    return orderDetail(req.params.reference);
  })
);
adminRouter.post(
  '/orders/:reference/actions',
  route(async (req) => updateOrder(req.params.reference, req.body, await currentStaff(req)))
);

adminRouter.get(
  '/staff',
  route(async (req) => {
    requireAdmin(await currentStaff(req));
    return prisma.staffAccount.findMany({ select: publicStaff, orderBy: { createdAt: 'asc' } });
  })
);
adminRouter.post(
  '/staff',
  route(async (req) => {
    const actor = await currentStaff(req);
    requireAdmin(actor);
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z
          .string()
          .trim()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        password: z.string().min(12).max(128),
        role: z.enum(['ADMIN', 'STAFF']),
      })
      .parse(req.body);
    const passwordHash = await hashPassword(input.password);
    const { password: _password, ...data } = input;
    return prisma.$transaction(async (tx) => {
      if (await tx.staffAccount.findUnique({ where: { email: data.email } }))
        throw new AppError('Staff email already exists', 409, 'EMAIL_IN_USE');
      const created = await tx.staffAccount.create({
        data: { ...data, passwordHash },
        select: publicStaff,
      });
      await tx.adminAudit.create({
        data: {
          staffId: actor.id,
          action: 'STAFF_CREATED',
          targetId: created.id,
          details: { email: created.email, role: created.role },
        },
      });
      return created;
    });
  })
);
adminRouter.patch(
  '/staff/:id',
  route(async (req) => {
    const actor = await currentStaff(req);
    requireAdmin(actor);
    const data = z
      .object({ isActive: z.boolean(), role: z.enum(['ADMIN', 'STAFF']) })
      .parse(req.body);
    if (req.params.id === actor.id)
      throw new AppError('You cannot change your own access', 400, 'SELF_CHANGE');
    return prisma.$transaction(
      async (tx) => {
        const existing = await tx.staffAccount.findUnique({ where: { id: req.params.id } });
        if (!existing) throw new AppError('Staff account not found', 404, 'NOT_FOUND');
        if (
          existing.role === 'ADMIN' &&
          existing.isActive &&
          (!data.isActive || data.role !== 'ADMIN') &&
          (await tx.staffAccount.count({ where: { role: 'ADMIN', isActive: true } })) <= 1
        )
          throw new AppError('Keep at least one active administrator', 409, 'LAST_ADMIN');
        const updated = await tx.staffAccount.update({
          where: { id: existing.id },
          data,
          select: publicStaff,
        });
        await tx.staffSession.deleteMany({ where: { staffId: existing.id } });
        await tx.adminAudit.create({
          data: { staffId: actor.id, action: 'STAFF_ACCESS', targetId: existing.id, details: data },
        });
        return updated;
      },
      { isolationLevel: 'Serializable' }
    );
  })
);

adminRouter.get(
  '/products',
  route(async (req) => {
    requireAdmin(await currentStaff(req));
    return listCatalogue(req.query);
  })
);
adminRouter.get(
  '/products/:id',
  route(async (req) => {
    requireAdmin(await currentStaff(req));
    const product = await catalogueRepository.detail(req.params.id);
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    return product;
  })
);
const price = z
  .number()
  .finite()
  .min(0)
  .max(100000000)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
    'Use at most two decimal places'
  );
adminRouter.patch(
  '/products/:id',
  route(async (req) => {
    const actor = await currentStaff(req);
    requireAdmin(actor);
    const input = z
      .object({
        updatedAt: z.string().datetime(),
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(5000),
        basePrice: price,
        isActive: z.boolean(),
        isFeatured: z.boolean(),
        pricingTiers: z
          .array(
            z.object({ minQuantity: z.number().int().positive().max(100000), unitPrice: price })
          )
          .max(20),
      })
      .parse(req.body);
    if (new Set(input.pricingTiers.map((t) => t.minQuantity)).size !== input.pricingTiers.length)
      throw new AppError('Duplicate pricing threshold', 400, 'INVALID_TIERS');
    const { updatedAt, pricingTiers, ...data } = input;
    return prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: { id: req.params.id, updatedAt: new Date(updatedAt) },
        data,
      });
      if (!result.count)
        throw new AppError('Product changed. Refresh and try again.', 409, 'CONFLICT');
      await tx.productPricingTier.deleteMany({ where: { productId: req.params.id } });
      await tx.productPricingTier.createMany({
        data: pricingTiers.map((t) => ({ ...t, productId: req.params.id })),
      });
      await tx.adminAudit.create({
        data: {
          staffId: actor.id,
          action: 'PRODUCT_UPDATED',
          targetId: req.params.id,
          details: input,
        },
      });
      return { ok: true };
    });
  })
);
adminRouter.patch(
  '/variants/:id',
  route(async (req) => {
    const actor = await currentStaff(req);
    requireAdmin(actor);
    const input = z
      .object({
        updatedAt: z.string().datetime(),
        name: z.string().trim().min(1).max(150),
        color: wristbandColorSchema,
        material: z.string().trim().max(80),
        size: z.string().trim().max(80),
        isActive: z.boolean(),
        priceAdjustment: price,
      })
      .parse(req.body);
    const { updatedAt, ...data } = input;
    return prisma.$transaction(async (tx) => {
      const result = await tx.productVariant.updateMany({
        where: { id: req.params.id, updatedAt: new Date(updatedAt) },
        data,
      });
      if (!result.count)
        throw new AppError('Variant changed. Refresh and try again.', 409, 'CONFLICT');
      await tx.adminAudit.create({
        data: {
          staffId: actor.id,
          action: 'VARIANT_UPDATED',
          targetId: req.params.id,
          details: input,
        },
      });
      return { ok: true };
    });
  })
);
adminRouter.post(
  '/inventory/:variantId',
  route(async (req) => {
    const actor = await currentStaff(req);
    requireAdmin(actor);
    const input = z
      .object({
        quantity: z.number().int().min(0).max(10000000),
        expectedQuantity: z.number().int().min(0),
        expectedReserved: z.number().int().min(0),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(req.body);
    if (input.quantity < input.expectedReserved)
      throw new AppError('Stock cannot be less than reserved units', 400, 'RESERVED_STOCK');
    return prisma.$transaction(async (tx) => {
      const changed = await tx.inventory.updateMany({
        where: {
          variantId: req.params.variantId,
          quantity: input.expectedQuantity,
          reservedQuantity: input.expectedReserved,
        },
        data: { quantity: input.quantity },
      });
      if (!changed.count)
        throw new AppError(
          'Stock changed or is missing. Refresh before adjusting.',
          409,
          'CONFLICT'
        );
      await tx.adminAudit.create({
        data: {
          staffId: actor.id,
          action: 'INVENTORY_ADJUSTED',
          targetId: req.params.variantId,
          details: input,
        },
      });
      return { ok: true };
    });
  })
);

adminRouter.use(catalogueAdmin);
