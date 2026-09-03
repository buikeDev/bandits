import type { NextFunction, Request, Response } from 'express';
import { customerAuthService } from './service.js';
import { readSessionToken } from './session.js';

export async function requireCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.locals.customer = await customerAuthService.currentCustomer(readSessionToken(req));
    next();
  } catch (error) {
    next(error);
  }
}
