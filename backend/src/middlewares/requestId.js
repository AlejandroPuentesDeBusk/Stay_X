// backend/src/middlewares/requestId.js
import { randomUUID } from 'crypto';

export const requestId = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || randomUUID();
  req.id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
};