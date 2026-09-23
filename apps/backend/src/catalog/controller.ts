import { productListQuerySchema } from '@bandit/shared';
import type { NextFunction, Request, Response } from 'express';
import { catalogService } from './service.js';

function cachePublicCatalogue(res: Response, seconds: number): void {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
}

export async function listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    cachePublicCatalogue(res, 300);
    res.json({ success: true, data: await catalogService.listCategories() });
  }
  catch (error) { next(error); }
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Stock is revalidated by the pricing and order endpoints, so catalogue browsing can be briefly cached.
    cachePublicCatalogue(res, 20);
    res.json({ success: true, data: await catalogService.listProducts(productListQuerySchema.parse(req.query)) });
  }
  catch (error) { next(error); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    cachePublicCatalogue(res, 30);
    res.json({ success: true, data: await catalogService.getProduct(req.params.slug) });
  }
  catch (error) { next(error); }
}
