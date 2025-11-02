// src/modules/chat/controller.js
import * as service from './service.js';
import { ok, created } from '../../core/http.js';
import { parsePagination } from '../../core/pagination.js';

/**
 * POST /chat/find-or-create
 * (Inquilino) Inicia un chat desde una propiedad.
 */
export const findOrCreateConversation = async (req, res) => {
  const conversation = await service.findOrCreateConversation(req.body, req.ctx);
  return ok(res, conversation); // 200 OK (o 201 si es nuevo)
};

/**
 * POST /chat/:conversationId/message
 * Envía un mensaje.
 */
export const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const message = await service.sendMessage(conversationId, req.body, req.ctx);
  return created(res, message);
};

/**
 * GET /chat/my-conversations
 * Lista las conversaciones del usuario.
 */
export const getMyConversations = async (req, res) => {
  const conversations = await service.listMyConversations(req.ctx);
  return ok(res, conversations);
};

/**
 * GET /chat/:conversationId/messages
 * Carga el historial de una conversación (paginado).
 */
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const pagination = parsePagination(req.query);
  const { items, total } = await service.listMessages(conversationId, req.ctx, pagination);
  return ok(res, items, { ...pagination, total });
};
