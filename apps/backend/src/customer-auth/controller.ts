import { customerLoginSchema, customerRegistrationSchema } from '@bandit/shared';
import type { NextFunction, Request, Response } from 'express';
import { customerAuthService } from './service.js';
import { enforce } from '../middleware/abuse.js';
import { clearSessionCookie, readSessionToken, setSessionCookie } from './session.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerAuthService.register(customerRegistrationSchema.parse(req.body));
    setSessionCookie(res, result.token);
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ success: true, data: { customer: result.customer } });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = customerLoginSchema.parse(req.body);
    await enforce(res, 'login_account', input.email.trim().toLowerCase(), 10, 900000);
    const result = await customerAuthService.login(input);
    setSessionCookie(res, result.token);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { customer: result.customer } });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerAuthService.currentCustomer(readSessionToken(req));
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { customer } });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await customerAuthService.logout(readSessionToken(req));
    clearSessionCookie(res);
    res.setHeader('Cache-Control', 'no-store');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
