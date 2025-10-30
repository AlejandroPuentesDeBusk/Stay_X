// backend/src/modules/auth/schemas.js
import { z } from 'zod';

// Esquema de Registro Estándar
export const RegisterSchema = z.object({
  email: z.string().email().max(160).trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().trim().min(1).max(120).optional(),
});

// Esquema de Login Estándar
export const LoginSchema = z.object({
  email: z.string().email().max(160).trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Esquema para la validación del Token de Email
export const VerifyEmailSchema = z.object({
  token: z.string().length(64),
});