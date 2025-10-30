// src/modules/auth/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { rateLimiter } from '../../middlewares/rateLimit.js';
import { validate } from '../../core/validate.js';
import * as controller from './controller.js';
import { 
  LoginSchema, 
  RegisterSchema, 
  VerifyEmailSchema 
} from './schemas.js';

const router = Router();

router.use(attachBaseContext); 

// --- Rutas de Flujo de Cuenta (Públicas y Limitadas) ---

// POST /auth/register - Registro con email/contraseña
router.post('/register', 
  rateLimiter, // Middleware aplicado correctamente
  validate(RegisterSchema), 
  controller.register
);

// POST /auth/login - Inicio de sesión
router.post('/login', 
  rateLimiter, // Middleware aplicado correctamente
  validate(LoginSchema), 
  controller.login
);

// POST /auth/google-login - Login social (Asume que el token de Google fue validado)
router.post('/google-login', 
  rateLimiter, // <--- CORRECCIÓN: Se pasa la referencia del middleware sin llamarlo
  // Nota: Aquí iría la validación del token de Google antes de llamar al controller
  controller.socialLogin
);

// GET /auth/verify-email - Verificación de correo (desde el link)
router.get('/verify-email', 
  validate(VerifyEmailSchema, 'query'), 
  controller.verifyEmail
);

// POST /auth/refresh-token - Obtener nuevo access token (puede venir en cookie o body)
router.post('/refresh-token', 
  controller.refreshToken
);

// POST /auth/logout - Cerrar sesión
router.post('/logout', 
  controller.logout
);

// FALTAN: password-resets, resend-verification-email

export default router;