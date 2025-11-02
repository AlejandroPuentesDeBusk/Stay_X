// src/modules/chat/router.js
import { Router } from 'express';
import { attachBaseContext } from '../../core/context.js';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRoles } from '../../auth/rbac.js';
import { ROLES } from '../../core/constants.js';
import { validate } from '../../core/validate.js';
import * as controller from './controller.js';
import * as validators from './validators.js';

const router = Router();

// 1. Inicializa req.ctx
router.use(attachBaseContext);

// 2. TODAS las rutas de 'chat' requieren autenticación
router.use(requireAuth);

// --- Rutas ---

/**
 * GET /chat/my-conversations
 * Lista todas las conversaciones del usuario (como inquilino o arrendador).
 */
router.get('/my-conversations',
  controller.getMyConversations
);

/**
 * POST /chat/find-or-create
 * (Inquilino) Inicia un chat desde una propiedad.
 */
router.post('/find-or-create',
  requireRoles(ROLES.arrendatario),
  validate(validators.FindOrCreateSchema),
  controller.findOrCreateConversation
);

/**
 * GET /chat/:conversationId/messages
 * Carga el historial de una conversación (paginado).
 */
router.get('/:conversationId/messages',
  validate(validators.QueryMessagesSchema, 'query'),
  controller.getMessages
  // La seguridad se verifica en el servicio (que el user pertenezca)
);

/**
 * POST /chat/:conversationId/message
 * Envía un mensaje.
 */
router.post('/:conversationId/message',
  validate(validators.SendMessageSchema),
  controller.sendMessage
  // La seguridad se verifica en el servicio
);

export default router;