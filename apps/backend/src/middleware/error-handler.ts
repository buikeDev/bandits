import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} was not found`,
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};
