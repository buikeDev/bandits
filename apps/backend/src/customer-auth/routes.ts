import { Router, type Router as ExpressRouter } from 'express';
import { login, logout, me, register } from './controller.js';

export const customerAuthRouter: ExpressRouter = Router();
customerAuthRouter.post('/register', register);
customerAuthRouter.post('/login', login);
customerAuthRouter.post('/logout', logout);
customerAuthRouter.get('/me', me);
