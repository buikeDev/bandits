import { Router, type Router as ExpressRouter } from 'express';
import { login, logout, me } from './controller.js';
import { oauthRouter } from './oauth.js';

export const customerAuthRouter: ExpressRouter = Router();
customerAuthRouter.use('/oauth', oauthRouter);
customerAuthRouter.post('/register', (_req, res) => {
  res
    .status(410)
    .json({
      success: false,
      error: 'Create your account with Google or Apple.',
      code: 'SOCIAL_SIGNUP_REQUIRED',
    });
});
customerAuthRouter.post('/login', login);
customerAuthRouter.post('/logout', logout);
customerAuthRouter.get('/me', me);
