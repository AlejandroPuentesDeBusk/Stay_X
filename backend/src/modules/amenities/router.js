// src/modules/amenities/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRoles } from '../../auth/rbac.js';
import { ROLES } from '../../core/constants.js';
import { validate } from '../../core/validate.js';
import * as controller from './controller.js';
import { AmenitySchema } from './validators.js';

const router = Router();

router.use(attachBaseContext);

// --- Rutas Públicas (Catálogo) ---
router.get('/',
  controller.list // Cualquiera puede ver la lista de amenidades
);

// --- Rutas de Admin (Gestión del Catálogo) ---
router.post('/',
  requireAuth,
  requireRoles(ROLES.admin),
  validate(AmenitySchema),
  controller.create
);

router.patch('/:id',
  requireAuth,
  requireRoles(ROLES.admin),
  validate(AmenitySchema.partial()), // .partial() hace opcionales los campos
  controller.update
);

router.delete('/:id',
  requireAuth,
  requireRoles(ROLES.admin),
  controller.remove
);

export default router;
