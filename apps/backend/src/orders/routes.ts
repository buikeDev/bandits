import { Router, type Router as ExpressRouter } from 'express';
import { catalogService } from '../catalog/service.js';
import { orderRepository } from './repository.js';
import { prepareOrder, priceOrder } from './service.js';
import { pricingSettings, resolveDesign } from './pricing.js';
import { orderRequestSchema } from './schema.js';
import { customerAuthService } from '../customer-auth/service.js';
import { readSessionToken } from '../customer-auth/session.js';
import { z } from 'zod';
import { orderDetail } from '../admin/orders.js';

export const orderRouter: ExpressRouter = Router();
const pricingDependencies = {
  ...orderRepository,
  product: catalogService.getProduct,
  fee: async () => (await pricingSettings()).customizationFeeMinor,
  resolve: resolveDesign,
};
orderRouter.post('/price', async (req, res, next) => {
  try {
    const result = await priceOrder(orderRequestSchema.parse(req.body), pricingDependencies);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: {
        ...result,
        lines: result.lines.map(({ logo: _logo, logos: _logos, ...line }) => line),
      },
    });
  } catch (error) {
    next(error);
  }
});
orderRouter.get('/mine/:reference', async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const customer = await customerAuthService.currentCustomer(readSessionToken(req));
    res.json({ success: true, data: await orderDetail(req.params.reference, customer.id) });
  } catch (error) {
    next(error);
  }
});
orderRouter.get('/mine', async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const customer = await customerAuthService.currentCustomer(readSessionToken(req));
    const page = z.coerce.number().int().min(1).max(10000).default(1).parse(req.query.page);
    const rows = await orderRepository.listForCustomer(customer.id, page);
    res.json({
      success: true,
      data: {
        page,
        hasMore: rows.length > 20,
        items: rows.slice(0, 20).map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
          subtotalMinor: row.subtotalMinor.toString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});
orderRouter.post('/', async (req, res, next) => {
  try {
    const token = readSessionToken(req);
    const customer = token ? await customerAuthService.currentCustomer(token) : null;
    const data = await prepareOrder(req.body, pricingDependencies, customer?.id ?? null);
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
