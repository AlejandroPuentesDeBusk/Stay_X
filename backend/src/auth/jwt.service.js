// backend/src/auth/jwt.service.js (Corregido)
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js'; // <--- Import nombrado

// Tiempos de expiración (Configuración crítica para seguridad y UX)
const ACCESS_TOKEN_EXPIRY = '15m'; // Token de Acceso: Corta duración (ej. 15 minutos)
const REFRESH_TOKEN_EXPIRY = '7d'; // Token de Refresco: Larga duración (ej. 7 días)

/**
 * Genera un Access Token y un Refresh Token para un usuario.
 * @param {object} user - El objeto de usuario limpio (sin secretos).
 */
export function generateTokens(user) {
  const payload = {
    id: user.id,
    role: user.role,
    // CRÍTICO: Añadir el status de verificación al token para chequeo rápido de RBAC
    is_identity_verified: user.is_identity_verified, 
    is_email_verified: user.is_email_verified, 
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

/**
 * Verifica y decodifica un token (útil para el middleware de Auth).
 */
export function verifyToken(token, isRefresh = false) {
  const secret = isRefresh ? env.JWT_REFRESH_SECRET : env.JWT_SECRET;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null; // El token es inválido o expiró
  }
}