// backend/src/modules/users/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { authJwt } from '../../middlewares/auth.js';
import { requireRoles } from '../../auth/rbac.js';
import { ROLES } from '../../core/constants.js';
import { validate } from '../../core/validate.js';
import * as controller from './controller.js';
import { QueryUserSchema, CreateUserSchema, UpdateUserSchema } from './validators.js';

const router = Router();

// 1. Inicializa req.ctx para todas las rutas de este módulo
router.use(attachBaseContext); //

// 2. Aplica autenticación a todas las rutas a partir de aquí
router.use(authJwt()); //

/* GET /users (lista) - Solo visible para el Admin (StayX staff) */
router.get('/', 
  requireRoles(ROLES.admin), //
  validate(QueryUserSchema, 'query'), //
  controller.listUsers
);

/* GET /users/:id (detalle) - Solo visible para el Admin */
router.get('/:id', 
  requireRoles(ROLES.admin), 
  controller.getUser
);

/* POST /users (crear) - Solo para uso administrativo (el registro es en /auth) */
router.post('/', 
  requireRoles(ROLES.admin), 
  validate(CreateUserSchema), 
  controller.createUser
);

/* PATCH /users/:id (actualizar) - Solo para uso administrativo */
router.patch('/:id', 
  requireRoles(ROLES.admin), 
  validate(UpdateUserSchema), 
  controller.updateUser
);

/* DELETE /users/:id (eliminar) - Solo para uso administrativo */
router.delete('/:id',
      requireRoles(ROLES.admin), 
  validate(UpdateUserSchema), 
  controller.updateUser
);

export default router;