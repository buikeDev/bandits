import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logApiError } from '../observability/logger.js';
import type { RequestContext } from './request-context.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} was not found`,
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const context = req as typeof req & RequestContext;
  const path = req.path || req.originalUrl.split('?')[0] || '/';
  if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
    res
      .status(413)
      .json({
        success: false,
        error: 'The artwork is too large. Use smaller images and try again.',
      });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, error: 'Invalid request', details: error.flatten() });
    return;
  }
  if (error instanceof AppError) {
    if (error.statusCode >= 500)
      logApiError({
        requestId: context.requestId,
        method: req.method,
        path,
        status: error.statusCode,
        code: error.code,
        errorName: error.name,
      });
    res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    return;
  }
  logApiError({
    requestId: context.requestId,
    method: req.method,
    path,
    status: 500,
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  res.status(500).json({ success: false, error: 'Internal server error' });
};
