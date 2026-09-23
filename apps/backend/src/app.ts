import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { customerAuthRouter } from './customer-auth/routes.js';
import { catalogRouter } from './catalog/routes.js';
import { orderRouter } from './orders/routes.js';
import { adminRouter } from './admin/routes.js';
import { createNewsletterRouter } from './newsletter/routes.js';
import { guard, validateAbuseConfig } from './middleware/abuse.js';
import { fulfilmentRouter } from './fulfilment/routes.js';
import { artworkRouter } from './artwork/routes.js';

type AppDependencies = {
  checkDatabase: () => Promise<void>;
  corsOrigin?: string;
};

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  validateAbuseConfig();
  // Trust only explicitly configured proxy addresses/subnets, never arbitrary forwarding headers.
  if (process.env.TRUSTED_PROXY_CIDRS)
    app.set(
      'trust proxy',
      process.env.TRUSTED_PROXY_CIDRS.split(',').map((value) => value.trim())
    );

  app.disable('x-powered-by');
  app.use(cors({ origin: dependencies.corsOrigin ?? 'http://localhost:3000', credentials: true }));
  app.use('/api/fulfilment', guard('enquiry_ip', 30, 3600), express.json({ limit: '16kb' }), fulfilmentRouter);
  app.use('/api/artwork', guard('artwork_ip', 60, 3600), express.json({ limit: '3mb' }), artworkRouter);
  app.post('/api/orders/price', guard('pricing_ip', 240, 60));
  app.post('/api/orders', guard('order_ip', 60, 900));
  app.post('/api/auth/login', guard('login_ip', 60, 900));
  app.post('/api/auth/register', guard('registration_ip', 20, 900));
  app.get('/api/auth/oauth/start/:provider', guard('oauth_start_ip', 30, 900));
  app.get('/api/auth/oauth/callback', guard('oauth_callback_ip', 60, 900));
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
