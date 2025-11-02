// src/modules/chat/service.js
import { Op } from 'sequelize';
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';
import redis from '../../core/db/redis.js';
import logger from '../../core/logger.js'; // Importar logger

// --- CORRECCIÓN: Usar los modelos 'conversations' y 'messages' ---
const Conversations = getModel('conversations');
const Messages = getModel('messages');
const Properties = getModel('properties');
const Users = getModel('users');

const REDIS_CHANNEL = 'chat';

/**
 * 1. (Inquilino) Encuentra o crea una conversación basada en una propiedad.
 */
export async function findOrCreateConversation(payload, context) {
  const { property_id } = payload;
  const applicantId = context.userId; // Inquilino

  // 1. Buscar si ya existe
  let conversation = await Conversations.findOne({
    where: { property_id, applicant_id: applicantId }
  });

  if (conversation) {
    return conversation;
  }

  // 2. Si no existe, crearla. Necesitamos al dueño.
  const property = await Properties.findByPk(property_id, {
    attributes: ['id', 'owner_id']
  });

  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }
  
  if (property.owner_id === applicantId) {
    throw new AppError('No puedes iniciar un chat sobre tu propia propiedad.', 403, ERR.FORBIDDEN);
  }

  // 3. Crear la nueva conversación
  conversation = await Conversations.create({
    property_id,
    applicant_id: applicantId,
    owner_id: property.owner_id,
  });

  return conversation;
}

/**
 * 2. Envía un mensaje.
 */
export async function sendMessage(conversationId, payload, context) {
  const senderId = context.userId;
  const { content } = payload;

  const conversation = await Conversations.findByPk(conversationId);
  if (!conversation) {
    throw new AppError('Conversación no encontrada.', 404, ERR.NOT_FOUND);
  }

  if (conversation.applicant_id !== senderId && conversation.owner_id !== senderId) {
    throw new AppError('No perteneces a esta conversación.', 403, ERR.FORBIDDEN);
  }

  const message = await Messages.create({
    conversation_id: conversationId,
    sender_id: senderId,
    content: content,
  });

  const recipientId = (conversation.applicant_id === senderId)
    ? conversation.owner_id
    : conversation.applicant_id;

  try {
    const fullMessage = await Messages.findByPk(message.id, {
      include: [{ model: Users, as: 'sender', attributes: ['id', 'name'] }]
    });

    const redisPayload = JSON.stringify({
      recipient_id: recipientId,
      message: fullMessage.toJSON(),
    });
    
    await redis.publisher.publish(REDIS_CHANNEL, redisPayload);
    
  } catch (err) {
    logger.error({ err, messageId: message.id }, 'Error al publicar mensaje en Redis');
  }

  return message;
}

/**
 * 3. Lista las conversaciones de un usuario (ambos roles).
 */
export async function listMyConversations(context) {
  const userId = context.userId;

  const conversations = await Conversations.findAll({
    where: {
      [Op.or]: [
        { applicant_id: userId },
        { owner_id: userId }
      ]
    },
    include: [
      { model: Users, as: 'applicant', attributes: ['id', 'name'] },
      { model: Users, as: 'owner', attributes: ['id', 'name'] },
      { model: Properties, as: 'property', attributes: ['id', 'title', 'cover_image_url'] }
    ],
    order: [['updated_at', 'DESC']]
  });
  return conversations;
}

/**
 * 4. Lista el historial de mensajes de una conversación.
 */
export async function listMessages(conversationId, context, pagination) {
  const userId = context.userId;

  const conversation = await Conversations.findByPk(conversationId, {
    attributes: ['id', 'applicant_id', 'owner_id']
  });

  if (!conversation) {
    throw new AppError('Conversación no encontrada.', 404, ERR.NOT_FOUND);
  }
  if (conversation.applicant_id !== userId && conversation.owner_id !== userId) {
    throw new AppError('No perteneces a esta conversación.', 403, ERR.FORBIDDEN);
  }

  const { rows, count } = await Messages.findAndCountAll({
    where: { conversation_id: conversationId },
    include: [{
      model: Users,
      as: 'sender',
      attributes: ['id', 'name']
    }],
    limit: pagination.limit,
    offset: pagination.offset,
    order: [['created_at', 'DESC']]
  });

  return { items: rows, total: count };
}
