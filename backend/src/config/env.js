// backend/src/config/env.js
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  METRICS_PUBLIC: z.string().default('true').transform(val => val === 'true'),
  
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  
  // Mantenemos la carga automática de modelos por defecto
  DB_AUTOLOAD_MODELS: z.string().default('true').transform(val => val === 'true'),

  // STRIPE CONFIGURATION (Para pagos y comisiones)
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY es requerido para pagos'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET es requerido para webhooks'),
  STRIPE_PRICE_LOOKUP_PREFIX: z.string().default('stayx'), // Prefijo de planes

  // MAILING
  MAIL_FROM: z.string().default('StayX <no-reply@stayx.com>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // FRONTEND URL BASE (para correos y redirecciones OAuth)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // GOOGLE OAUTH
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // ELIMINADO: GEMINI_API_KEY, TWILIO_* y META_*
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

console.log(parsedEnv.data);

// Parse CORS origins into array
export const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim());