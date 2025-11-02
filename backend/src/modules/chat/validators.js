// src/modules/chat/validators.js
import { z } from 'zod';

/**
 * POST /chat/find-or-create
 * (Inquilino) Encuentra o crea un chat basado en una propiedad.
 */
export const FindOrCreateSchema = z.object({
  property_id: z.string().uuid('El ID de la propiedad no es válido'),
});

/**
 * POST /chat/:conversationId/message
 * Envía un mensaje a una conversación.
 */
export const SendMessageSchema = z.object({
  content: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(5000),
});

/**
 * GET /chat/:conversationId/messages
 * Valida la paginación para cargar el historial de mensajes.
 */
export const QueryMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
