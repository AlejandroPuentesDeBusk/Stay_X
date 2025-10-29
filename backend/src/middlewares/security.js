// src/middlewares/security.js
import helmet from 'helmet';
import cors from 'cors';
import { corsOrigins } from '../config/env.js';

/**
 * HELMET
 * - Mantiene CSP base
 * - Ajusta COOP para permitir popups de OAuth (same-origin-allow-popups)
 * - Desactiva COEP/COEP estrictos que pueden romper integraciones de terceros
 * - Añade connectSrc dinámico para llamadas fetch/XHR hacia orígenes permitidos
 */
const ORIGINS = Array.isArray(corsOrigins) ? corsOrigins : (corsOrigins ? [corsOrigins] : []);
const connectSrc = ["'self'", ...ORIGINS]; // permite llamar al backend / subdominios whitelisteados

export const security = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],                // mantenemos sin inline scripts
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc,                           // <-- permite fetch/XHR a orígenes en whitelist
      frameAncestors: ["'self'"],           // evita clickjacking básicos
    },
  },
  crossOriginEmbedderPolicy: false,         // evita romper recursos de terceros
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // necesario para flujos OAuth en popup
  referrerPolicy: { policy: 'no-referrer' },
  // Puedes añadir permisos finos si lo necesitas:
  // permissionsPolicy: { features: { geolocation: ['self'] } },
});

/**
 * CORS
 * - Credenciales activadas (cookies httpOnly)
 * - Origin permite SSR/cURL (sin Origin) y orígenes whitelisteados
 * - Preflight robusto
 */
export const corsConfig = cors({
  origin(origin, cb) {
    // Permite SSR interno (sin Origin) y herramientas locales (curl/postman que a veces no envían Origin)
    if (!origin) return cb(null, true);
    if (ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'));
  },
  credentials: true, // necesario para cookies SameSite=None
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'X-Requested-With'],
  exposedHeaders: ['Location'], // útil para seguir redirects en clientes
  optionsSuccessStatus: 204,
  maxAge: 86400, // cachea preflights 24h
});