// src/core/socket.js
import { Server } from 'socket.io';
import parser from 'socket.io-msgpack-parser';
import logger from './logger.js';
import redis from './db/redis.js'; // El cliente redis [cite: src/core/db/reddis.js]
import { verifyToken } from '../auth/jwt.service.js'; // [cite: src/auth/jwt.service.js]
import { getModel } from './db/registry.js';
import { corsOrigins } from '../config/env.js';

const REDIS_CHANNEL = 'chat';
let io = null;

/**
 * Middleware de autenticación de Socket.io
 * Valida el token JWT enviado en la conexión.
 */
async function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Socket Auth Error: Token no proporcionado'));
  }

  try {
    const payload = verifyToken(token, false); // false = Access Token
    if (!payload || !payload.id) {
      return next(new Error('Socket Auth Error: Token inválido'));
    }

    // CRÍTICO: Verificar que el usuario existe en la DB
    const Users = getModel('users');
    const user = await Users.findByPk(payload.id, { attributes: ['id', 'role'] });
    if (!user) {
      return next(new Error('Socket Auth Error: Usuario no encontrado'));
    }
    
    // Adjuntar el usuario al objeto socket
    socket.user = user.toJSON();
    next();

  } catch (err) {
    logger.warn({ err }, 'Socket Auth Error');
    return next(new Error('Socket Auth Error: Token expirado o malformado'));
  }
}

/**
 * Maneja el evento de mensaje de Redis (Pub/Sub)
 */
async function onRedisMessage(channel, message) {
  if (channel !== REDIS_CHANNEL) return;

  try {
    const { recipient_id, message: messageData } = JSON.parse(message);
    
    if (!io) return;

    // Emitir el evento 'new_message' SÓLO a la "sala"
    // que coincide con el ID del destinatario.
    io.to(recipientId).emit('new_message', messageData);

    logger.info({ recipientId, messageId: messageData.id }, 'Socket: Mensaje emitido a la sala');

  } catch (err) {
    logger.error({ err, message }, 'Socket: Error al procesar mensaje de Redis');
  }
}

/**
 * Inicializa el servidor Socket.io
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    parser, // Usar msgpack para mejor rendimiento
    cors: {
      origin: corsOrigins, // Usar los mismos orígenes de CORS [cite: src/config/env.js]
      methods: ['GET', 'POST'],
      credentials: true
    },
    serveClient: false,
    transports: ['websocket', 'polling'] // Permitir fallback a polling
  });

  // 1. Usar el middleware de autenticación
  io.use(socketAuth);

  // 2. Conectar el suscriptor de Redis
  redis.subscriber.subscribe(REDIS_CHANNEL, (err, count) => {
    if (err) {
      logger.error({ err }, 'Socket: Error al suscribirse al canal de Redis');
      return;
    }
    logger.info(`Socket: Suscrito al canal '${REDIS_CHANNEL}' (${count} suscriptores)`);
  });
  
  redis.subscriber.on('message', onRedisMessage);

  // 3. Manejar conexiones de clientes
  io.on('connection', (socket) => {
    logger.info({ userId: socket.user.id }, 'Socket: Usuario conectado');

    // 4. Unir al usuario a su propia "sala"
    // Esto nos permite enviarle mensajes directos usando io.to(userId)
    socket.join(socket.user.id);

    socket.on('disconnect', (reason) => {
      logger.info({ userId: socket.user.id, reason }, 'Socket: Usuario desconectado');
    });

    // Opcional: Manejar errores de socket
    socket.on('error', (err) => {
       logger.warn({ userId: socket.user.id, err }, 'Socket: Error de cliente');
    });
  });
  
  logger.info('Servidor Socket.io inicializado.');
  return io;
}