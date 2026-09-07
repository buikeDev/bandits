import { productListQuerySchema } from '@bandit/shared';
import type { NextFunction, Request, Response } from 'express';
import { catalogService } from './service.js';

export async function listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ success: true, data: await catalogService.listCategories() }); }
  catch (error) { next(error); }
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ success: true, data: await catalogService.listProducts(productListQuerySchema.parse(req.query)) }); }
  catch (error) { next(error); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ success: true, data: await catalogService.getProduct(req.params.slug) }); }
  catch (error) { next(error); }
}
