import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { customerAuthRouter } from './customer-auth/routes.js';
import { catalogRouter } from './catalog/routes.js';
import { orderRouter } from './orders/routes.js';
import { adminRouter } from './admin/routes.js';
import { createNewsletterRouter } from './newsletter/routes.js';

type AppDependencies = {
  checkDatabase: () => Promise<void>;
  corsOrigin?: string;
};

export function createApp(dependencies: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: dependencies.corsOrigin ?? 'http://localhost:3000', credentials: true }));
  app.use('/api/orders', express.json({ limit: '6mb' }), orderRouter);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.get('/api/ready', async (_req, res, next) => {
    try {
      await dependencies.checkDatabase();
      res.json({ success: true, data: { status: 'ready', database: 'connected' } });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', customerAuthRouter);
  app.use('/api/newsletter', createNewsletterRouter());
  app.use('/api/catalog', catalogRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
