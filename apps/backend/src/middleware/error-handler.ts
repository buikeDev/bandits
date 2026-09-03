import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} was not found`,
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, error: 'Invalid request', details: error.flatten() });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};
