// src/modules/applications/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRoles } from '../../auth/rbac.js';
import { ROLES } from '../../core/constants.js';
import { validate } from '../../core/validate.js';
import * as controller from './controller.js';
import * as validators from './validators.js';

const router = Router();

// 1. Inicializa req.ctx para todas las rutas
router.use(attachBaseContext);

// 2. TODAS las rutas de 'applications' requieren autenticación
router.use(requireAuth);

// --- Rutas de Inquilino (Arrendatario) ---

/**
 * GET /applications/my-applications
 * Lista las solicitudes enviadas por el inquilino actual.
 */
router.get('/my-applications',
  requireRoles(ROLES.arrendatario),
  validate(validators.QueryApplicationsSchema, 'query'),
  controller.getMyApplications
);

/**
 * POST /applications
 * Crea una nueva solicitud para una propiedad.
 */
router.post('/',
  requireRoles(ROLES.arrendatario),
  validate(validators.CreateApplicationSchema),
  controller.createApplication
);


// --- Rutas de Arrendador ---

/**
 * GET /applications/received
 * Lista las solicitudes recibidas en las propiedades del arrendador actual.
 */
router.get('/received',
  requireRoles(ROLES.arrendador),
  validate(validators.QueryApplicationsSchema, 'query'),
  controller.getReceivedApplications
);

/**
 * PATCH /applications/:id
 * Aprueba, rechaza o cancela una solicitud recibida.
 */
router.patch('/:id',
  requireRoles(ROLES.arrendador), // Solo arrendadores
  validate(validators.UpdateApplicationStatusSchema),
  controller.updateApplicationStatus // El servicio verifica que sea EL DUEÑO
);

export default router;
