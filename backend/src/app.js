// src/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import logger from './core/logger.js';
import { requestId } from './middlewares/requestId.js';
import { security, corsConfig } from './middlewares/security.js';
import { rateLimiter } from './middlewares/rateLimit.js';
import { notFoundHandler, errorHandler } from './middlewares/error.js';

export function createApp(router) {
  const app = express();

  // ✅ CORRECCIÓN DE ESTABILIDAD: Confiar en los encabezados del proxy
  app.set('trust proxy', 1);

  const STRIPE_WEBHOOK_PATH = '/api/v1/stripe/webhook';

  const isStripeWebhook = (req) => {
    const raw = (req.originalUrl || req.url || '');
    const pathOnly = raw.split('?')[0];
    return (
      pathOnly === STRIPE_WEBHOOK_PATH ||
      (pathOnly.endsWith('/') && pathOnly.slice(0, -1) === STRIPE_WEBHOOK_PATH)
    );
  };

  const skipIfStripe = (mw) => (req, res, next) => {
    if (isStripeWebhook(req)) return next();
    return mw(req, res, next);
  };

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        }), 
      },
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
        if (res.statusCode >= 500 || err) return 'error';
        return 'info';
      },
      customSuccessMessage: (req, res) => `${res.statusCode} ${req.method} ${req.url}`,
      customErrorMessage: (req, res, err) => `ERROR ${res.statusCode} ${req.method} ${req.url} - ${err.message}`,
    })
  );
  
  app.use(STRIPE_WEBHOOK_PATH, express.raw({ type: '*/*' }));

  app.use(STRIPE_WEBHOOK_PATH, (req, _res, next) => {
    try {
      logger.info(
        {
          path: req.originalUrl,
          method: req.method,
          contentType: req.headers['content-type'],
          hasStripeSig: Boolean(req.headers['stripe-signature']),
          contentLength: req.headers['content-length'],
          reqId: req.id || req.headers['x-request-id'],
        },
        '[STRIPE WEBHOOK] incoming request'
      );
    } catch {}
    next();
  });

  app.use(skipIfStripe(security));
  app.use(skipIfStripe(corsConfig));
  app.use(skipIfStripe(rateLimiter));

  app.use(cookieParser());


  const jsonParser = express.json({ limit: '10mb' });
  const urlencodedParser = express.urlencoded({ extended: true, limit: '10mb' });

  app.use((req, res, next) => {
    if (isStripeWebhook(req)) return next();
    return jsonParser(req, res, next);
  });

  app.use((req, res, next) => {
    if (isStripeWebhook(req)) return next();
    return urlencodedParser(req, res, next);
  });

  app.use('/api/v1', router);

  app.use('*', notFoundHandler);
  app.use(errorHandler);

  return app;
}