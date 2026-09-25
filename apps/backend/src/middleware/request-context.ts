import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export type RequestContext = {
  requestId?: string;
};

export const requestContext: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  (req as typeof req & RequestContext).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
