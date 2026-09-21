import { Router, type Router as ExpressRouter } from 'express';
import { prisma, Prisma } from '@bandit/database';
import { z } from 'zod';
import { wristbandColorSchema } from '@bandit/shared';
import { randomUUID } from 'node:crypto';
import { currentStaff, requireAdmin } from './auth.js';
import { AppError } from '../errors/app-error.js';
import { jsonSafe } from './orders.js';

export const catalogueAdmin: ExpressRouter = Router();
const slug = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const image = z
  .string()
  .max(2000)
  .refine((v) => {
    if (v.startsWith('/images/') && !v.includes('..')) return true;
    try {
      const url = new URL(v);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'Use an uploaded image or HTTPS URL');
const price = z.number().min(0).max(100000000).multipleOf(0.01);
const category = z.object({
  name: z.string().trim().min(1).max(150),
  slug,
  description: z.string().max(5000).default(''),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
const product = z.object({
  name: z.string().trim().min(1).max(200),
  slug,
  description: z.string().min(1).max(5000),
  categoryId: z.string().min(1),
  basePrice: price,
  imageUrl: image,
  images: z.array(image).max(10).default([]),
  isFeatured: z.boolean().default(false),
  featuredOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(false),
});
const variant = z.object({
  name: z.string().trim().min(1).max(150),
  sku: z.string().trim().min(1).max(150),
  color: wristbandColorSchema,
  material: z.string().trim().min(1).max(80),
  size: z.string().max(80).default(''),
  imageUrl: image.nullable().default(null),
  priceAdjustment: price.default(0),
  isActive: z.boolean().default(true),
  isCustomizationEnabled: z.boolean().default(true),
  quantity: z.number().int().min(0).max(10000000),
  lowStockThreshold: z.number().int().min(0).max(10000000).default(100),
});

catalogueAdmin.use((req, res, next) => {
  void currentStaff(req)
    .then((staff) => {
      requireAdmin(staff);
      res.locals.actor = staff;
      next();
    })
    .catch(next);
});
function endpoint(
  method: 'get' | 'post' | 'patch',
  path: string,
  run: (
    body: unknown,
    params: Record<string, string>,
    actor: string,
    query: unknown
  ) => Promise<unknown>
) {
  catalogueAdmin[method](path, (req, res, next) => {
    void run(req.body, req.params, res.locals.actor.id, req.query)
      .then((data) => res.json({ success: true, data: jsonSafe(data) }))
      .catch((error) => {
        if (error?.code === 'P2002')
          return next(new AppError('That slug or SKU already exists.', 409, 'DUPLICATE'));
        if (error?.code === 'P2025' || error?.code === 'P2003')
          return next(new AppError('The selected record is unavailable.', 409, 'NOT_FOUND'));
        next(error);
      });
  });
}
async function audit(
  tx: Prisma.TransactionClient,
  staffId: string,
  action: string,
  targetId: string,
  details: Prisma.InputJsonValue
) {
  await tx.adminAudit.create({ data: { staffId, action, targetId, details } });
}
endpoint(
  'get',
  '/settings',
  async () => await prisma.commerceSettings.findUnique({ where: { id: 'default' } })
);
endpoint('patch', '/settings', async (body, _params, actor) => {
  const input = z
    .object({
      customizationFeeMinor: z.number().int().min(0).max(100000000),
      updatedAt: z.string().datetime(),
    })
    .parse(body);
  return prisma.$transaction(async (tx) => {
    const saved = await tx.commerceSettings.updateMany({
      where: { id: 'default', updatedAt: new Date(input.updatedAt) },
      data: { customizationFeeMinor: input.customizationFeeMinor },
    });
    if (!saved.count) throw new AppError('Pricing changed. Refresh first.', 409, 'CONFLICT');
    await audit(tx, actor, 'PRICING_UPDATED', 'default', input);
    return { ok: true };
  });
});
endpoint('get', '/categories', async () =>
  prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })
);
endpoint('post', '/categories', async (body, _params, actor) =>
  prisma.$transaction(async (tx) => {
    const data = category.parse(body);
    const row = await tx.category.create({ data });
    await audit(tx, actor, 'CATEGORY_CREATED', row.id, data);
    return row;
  })
);
endpoint('patch', '/categories/:id', async (body, params, actor) =>
  prisma.$transaction(async (tx) => {
    const { updatedAt, ...data } = category
      .extend({ updatedAt: z.string().datetime() })
      .parse(body);
    const changed = await tx.category.updateMany({
      where: { id: params.id, updatedAt: new Date(updatedAt) },
      data,
    });
    if (!changed.count) throw new AppError('Category changed. Refresh first.', 409, 'CONFLICT');
    await audit(tx, actor, 'CATEGORY_UPDATED', params.id, data);
    return { ok: true };
  })
);
endpoint('post', '/products', async (body, _params, actor) =>
  prisma.$transaction(async (tx) => {
    const data = product.parse(body);
    const row = await tx.product.create({ data });
    await audit(tx, actor, 'PRODUCT_CREATED', row.id, data);
    return row;
  })
);
endpoint('post', '/products/:id/variants', async (body, params, actor) => {
  const { quantity, lowStockThreshold, ...data } = variant.parse(body);
  return prisma.$transaction(async (tx) => {
    const row = await tx.productVariant.create({
      data: {
        ...data,
        productId: params.id,
        inventory: { create: { quantity, lowStockThreshold } },
      },
    });
    await audit(tx, actor, 'VARIANT_CREATED', row.id, { ...data, quantity, lowStockThreshold });
    return row;
  });
});
endpoint('patch', '/products/:id/media', async (body, params, actor) =>
  prisma.$transaction(async (tx) => {
    const { updatedAt, ...data } = z
      .object({
        updatedAt: z.string().datetime(),
        imageUrl: image,
        images: z.array(image).max(10),
        featuredOrder: z.number().int().min(0),
        categoryId: z.string().min(1),
      })
      .parse(body);
    const changed = await tx.product.updateMany({
      where: { id: params.id, updatedAt: new Date(updatedAt) },
      data,
    });
    if (!changed.count) throw new AppError('Product changed. Refresh first.', 409, 'CONFLICT');
    await audit(tx, actor, 'PRODUCT_MEDIA_UPDATED', params.id, data);
    return { ok: true };
  })
);
endpoint('patch', '/variants/:id/options', async (body, params, actor) =>
  prisma.$transaction(async (tx) => {
    const { updatedAt, ...data } = z
      .object({
        updatedAt: z.string().datetime(),
        imageUrl: image.nullable(),
        isCustomizationEnabled: z.boolean(),
      })
      .parse(body);
    const changed = await tx.productVariant.updateMany({
      where: { id: params.id, updatedAt: new Date(updatedAt) },
      data,
    });
    if (!changed.count) throw new AppError('Variant changed. Refresh first.', 409, 'CONFLICT');
    await audit(tx, actor, 'VARIANT_OPTIONS_UPDATED', params.id, data);
    return { ok: true };
  })
);
endpoint('post', '/inventory/:id/receive', async (body, params, actor) =>
  prisma.$transaction(async (tx) => {
    const input = z
      .object({
        requestId: z.string().uuid(),
        quantity: z.number().int().positive().max(10000000),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(body);
    const previous = await tx.adminAudit.findUnique({ where: { id: input.requestId } });
    if (previous) {
      const detail = previous.details as { quantity?: number; reason?: string };
      if (
        previous.action !== 'STOCK_RECEIVED' ||
        previous.staffId !== actor ||
        previous.targetId !== params.id ||
        detail.quantity !== input.quantity ||
        detail.reason !== input.reason
      )
        throw new AppError('This stock receipt reference is already in use.', 409, 'CONFLICT');
      return { ok: true };
    }
    const changed = await tx.inventory.updateMany({
      where: { variantId: params.id, quantity: { lte: 10000000 - input.quantity } },
      data: { quantity: { increment: input.quantity } },
    });
    if (!changed.count)
      throw new AppError('Stock record missing or maximum quantity exceeded', 409, 'INVALID_STOCK');
    await tx.adminAudit.create({
      data: {
        id: input.requestId,
        staffId: actor,
        action: 'STOCK_RECEIVED',
        targetId: params.id,
        details: input,
      },
    });
    return { ok: true };
  })
);
endpoint('patch', '/inventory/:id/threshold', async (body, params, actor) =>
  prisma.$transaction(async (tx) => {
    const input = z
      .object({ lowStockThreshold: z.number().int().min(0).max(10000000) })
      .parse(body);
    await tx.inventory.update({ where: { variantId: params.id }, data: input });
    await audit(tx, actor, 'STOCK_THRESHOLD', params.id, input);
    return { ok: true };
  })
);
endpoint('get', '/inventory/:id/history', async (_body, params, _actor, query) => {
  const { page } = z
    .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
    .parse(query);
  const adjustments = await prisma.adminAudit.findMany({
    where: { targetId: params.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * 30,
    take: 31,
  });
  const reservations = await prisma.stockReservation.findMany({
    where: { variantId: params.id },
    include: {
      workflow: {
        select: {
          order: { select: { reference: true } },
          events: { where: { action: 'status' }, orderBy: { createdAt: 'desc' }, take: 10 },
        },
      },
    },
    take: 100,
    orderBy: { id: 'desc' },
  });
  const ids = [...new Set(adjustments.map((a) => a.staffId))];
  const staff = await prisma.staffAccount.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return {
    items: adjustments
      .slice(0, 30)
      .map((a) => ({ ...a, staffName: staff.find((s) => s.id === a.staffId)?.name ?? 'Staff' })),
    hasMore: adjustments.length > 30,
    reservations,
  };
});
endpoint('post', '/images', async (body, _params, actor) => {
  const { data } = z
    .object({
      data: z
        .string()
        .max(700000)
        .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
    })
    .parse(body);
  const match = /^data:image\/(png|jpeg|webp);base64,(.*)$/.exec(data)!;
  const bytes = Buffer.from(match[2], 'base64');
  const valid =
    match[1] === 'png'
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === 'jpeg'
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid || bytes.length > 500000)
    throw new AppError('Upload a PNG, JPEG or WebP image under 500 KB.', 400, 'INVALID_IMAGE');
  const origin = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.PRODUCT_IMAGE_BUCKET ?? 'product-images';
  if (!origin || !key)
    throw new AppError('Product image storage is not configured.', 503, 'STORAGE_UNAVAILABLE');
  const base = new URL(origin);
  if (
    base.protocol !== 'https:' ||
    !base.hostname.endsWith('.supabase.co') ||
    !/^[a-z0-9-]+$/.test(bucket)
  )
    throw new AppError('Invalid storage configuration', 503, 'STORAGE_UNAVAILABLE');
  const path = `${actor}/${randomUUID()}.${match[1]}`;
  const response = await fetch(`${base.origin}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': `image/${match[1]}` },
    body: bytes,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new AppError(
      'Image upload failed. Check storage configuration.',
      502,
      'STORAGE_UNAVAILABLE'
    );
  const url = `${base.origin}/storage/v1/object/public/${bucket}/${path}`;
  await prisma.adminAudit.create({
    data: { staffId: actor, action: 'IMAGE_UPLOADED', targetId: path, details: { url } },
  });
  return { url };
});
