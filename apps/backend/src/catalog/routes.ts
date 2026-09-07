import { Router, type Router as ExpressRouter } from 'express';
import { getProduct, listCategories, listProducts } from './controller.js';

export const catalogRouter: ExpressRouter = Router();
catalogRouter.get('/categories', listCategories);
catalogRouter.get('/products', listProducts);
catalogRouter.get('/products/:slug', getProduct);
