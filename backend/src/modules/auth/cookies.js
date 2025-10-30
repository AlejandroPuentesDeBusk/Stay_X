// backend/src/modules/auth/cookies.js
import { env } from '../../config/env.js';

const cookieOptions = (maxAge) => ({
  maxAge, 
  httpOnly: true, // CRÍTICO: Previene XSS
  secure: env.NODE_ENV === 'production', // CRÍTICO: Solo se envía en HTTPS en producción
  sameSite: 'Lax',
  path: '/',
});

// Tiempo en milisegundos
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

/**
 * Establece las cookies HTTP-Only para el Access Token y el Refresh Token.
 */
export function setAuthCookies(res, accessToken, refreshToken) {
  // Access Token (Más corto, más seguro)
  res.cookie('access_token', accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
  
  // Refresh Token (Más largo, se usa para renovar)
  res.cookie('refresh_token', refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
}

/**
 * Elimina las cookies de autenticación.
 */
export function clearAuthCookies(res) {
  // Establecer expiración a 0 para eliminar las cookies
  res.cookie('access_token', '', { ...cookieOptions(0), maxAge: 0 });
  res.cookie('refresh_token', '', { ...cookieOptions(0), maxAge: 0 });
}