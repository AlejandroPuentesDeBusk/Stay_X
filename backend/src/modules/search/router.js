// src/modules/search/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { authOptional } from '../../middlewares/auth.js';
import { validate } from '../../core/validate.js';
import * as controller from './controller.js';
import { QuerySearchSchema } from './validators.js';

const router = Router();

// 1. Inicializa req.ctx para todas las rutas
router.use(attachBaseContext);

/**
 * GET /search
 * El "super-endpoint" público para todas las búsquedas,
 * filtros y consultas de mapa.
 */
router.get('/',
  authOptional, // Cualquiera puede buscar
  validate(QuerySearchSchema, 'query'), // Valida todos los query params
  controller.searchProperties
);

export default router;
