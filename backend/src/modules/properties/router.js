// src/modules/properties/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { authOptional, requireAuth } from '../../middlewares/auth.js';
import { requireRoles } from '../../auth/rbac.js';
import { ROLES } from '../../core/constants.js';
import { validate } from '../../core/validate.js';
import * as controllers from './controller.js';
import * as validators from './validators.js';

const router = Router();

// 1. Inicializa req.ctx para todas las rutas de este módulo
router.use(attachBaseContext);

// --- Rutas Públicas (con autenticación opcional) ---

/**
 * GET /properties (Marketplace)
 * Lista todas las propiedades públicas ('published').
 */
router.get('/',
  authOptional, // Cualquiera puede ver, pero sabemos quién es si está logueado
  validate(validators.QueryPublicPropertiesSchema, 'query'),
  controllers.listPublicProperties
);

/**
 * GET /properties/:id (Detalle de propiedad)
 * Muestra una propiedad. Oculta 'draft' si no es el dueño.
 */
router.get('/:id',
  authOptional, // authOptional pasa el req.ctx si existe
  controllers.getProperty
);


// --- Rutas Privadas (Requieren Autenticación) ---

/**
 * GET /properties/my-properties
 * Endpoint especial para que un arrendador vea SUS propiedades (incluyendo drafts).
 * Debe ir ANTES de /:id para que 'my-properties' no sea tratado como un ID.
 */
router.get('/my-properties',
  requireAuth, // Debe estar logueado
  requireRoles(ROLES.arrendador), // Debe ser arrendador
  validate(validators.QueryMyPropertiesSchema, 'query'),
  controllers.listMyProperties
);

/**
 * POST /properties
 * Crea una nueva propiedad (como 'draft').
 */
router.post('/',
  requireAuth,
  requireRoles(ROLES.arrendador), // Solo arrendadores
  validate(validators.CreatePropertySchema),
  controllers.createProperty
);

/**
 * PATCH /properties/:id
 * Actualiza una propiedad (dueño o admin).
 */
router.patch('/:id',
  requireAuth, // Debe estar logueado
  validate(validators.UpdatePropertySchema),
  controllers.updateProperty // El servicio verifica si es dueño o admin
);

/**
 * DELETE /properties/:id
 * Elimina una propiedad (dueño o admin).
 */
router.delete('/:id',
  requireAuth, // Debe estar logueado
  controllers.deleteProperty // El servicio verifica permisos y estado
);


export default router;