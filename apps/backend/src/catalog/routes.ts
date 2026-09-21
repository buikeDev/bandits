import { prisma } from '@bandit/database';
import { catalogService } from './service.js';
import { pricingSettings } from '../orders/pricing.js';
import { Router, type Router as ExpressRouter } from 'express';
import { getProduct, listCategories, listProducts } from './controller.js';

export const catalogRouter: ExpressRouter = Router();
catalogRouter.get('/categories', listCategories);
catalogRouter.get('/products', listProducts);
catalogRouter.get('/products/:slug', getProduct);

catalogRouter.get('/design-options', async (_req, res, next) => {
  try {
    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        kind: 'WRISTBAND',
        category: { isActive: true },
        variants: { some: { isActive: true, isCustomizationEnabled: true } },
      },
      orderBy: { name: 'asc' },
    });
    const products = await Promise.all(rows.map((p) => catalogService.getProduct(p.slug)));
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { products, ...(await pricingSettings()) } });
  } catch (error) {
    next(error);
  }
});
