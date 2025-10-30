// backend/src/modules/auth/controller.js
import * as authService from './service.js';
import * as jwtService from '../../auth/jwt.service.js';
import { ok, created, noContent } from '../../core/http.js';
import { setAuthCookies, clearAuthCookies } from './cookies.js'; // Necesitas crear este archivo de helpers

// --- Helpers para Cookies ---
// NOTA: Este archivo (cookies.js) es CRÍTICO para el flujo de cookies HTTP-Only.

/**
 * Envía la respuesta de Tokens (Web y Móvil) y establece Cookies (Web).
 */
function sendTokenResponse(res, accessToken, refreshToken) {
  // 1. Establece cookies HTTP-Only (Flujo Web/Browser)
  setAuthCookies(res, accessToken, refreshToken);
  
  // 2. Envía tokens en el cuerpo (Flujo Móvil/API)
  return ok(res, {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    // La expiración debe ser manejada por el cliente basado en la info de la cookie o el payload JWT
  });
}

// --- Endpoints de Auth ---

/** POST /auth/register - Registro de usuario estándar */
export const register = async (req, res) => {
  const user = await authService.registerService(req.body);
  
  // No se devuelve el token en el registro, solo un 201 (Created)
  return created(res, { 
    user, 
    message: 'Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta.' 
  });
};

/** POST /auth/login - Login de usuario estándar */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken } = await authService.loginService(email, password);
  
  return sendTokenResponse(res, accessToken, refreshToken);
};

/** POST /auth/google-login - Login/Registro Social (Ejemplo) */
export const socialLogin = async (req, res) => {
  // CRÍTICO: Aquí DEBE haber un middleware para VALIDAR el token de Google
  // Por simplicidad, asumimos que req.body.email y req.body.name son válidos
  const { email, name } = req.body; 
  
  const { user, tokens, newUser } = await authService.socialLoginService(email, name);
  
  sendTokenResponse(res, tokens.accessToken, tokens.refreshToken);
  
  if (newUser) {
    return res.status(201).json({ 
      user, 
      ...tokens,
      message: 'Cuenta social creada y sesión iniciada.' 
    });
  } else {
    return res.status(200).json({ 
      user, 
      ...tokens,
      message: 'Sesión iniciada correctamente.' 
    });
  }
};

/** GET /auth/verify-email?token=... - Verificación de correo */
export const verifyEmail = async (req, res) => {
  const { token } = req.query; // Validado por el middleware Zod
  const email = await authService.verifyEmailService(token);
  
  return ok(res, { message: `El correo ${email} ha sido verificado exitosamente.` });
};

/** POST /auth/refresh-token - Refrescar el token de acceso */
export const refreshToken = async (req, res) => {
  // Para Web (cookies): El refresh token viene en las cookies
  const refreshToken = req.cookies.refresh_token || req.body.refresh_token; 
  
  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Refresh token no proporcionado.' 
    });
  }

  const { accessToken } = await authService.refreshAccessTokenService(refreshToken);
  
  // Se actualiza la cookie y se devuelve el nuevo token de acceso en el cuerpo
  setAuthCookies(res, accessToken, refreshToken); 
  
  return ok(res, { access_token: accessToken, token_type: 'Bearer' });
};

/** POST /auth/logout - Cerrar sesión */
export const logout = async (req, res) => {
  // 1. Eliminar cookies (Web)
  clearAuthCookies(res);
  
  // 2. Respuesta limpia
  return noContent(res);
};