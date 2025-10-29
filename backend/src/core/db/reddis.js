// backend/src/core/redis.js
import { Redis } from 'ioredis';
import logger from '..logger.js';
import { AppError, ERR } from './errors.js';

// Asume una variable de entorno REDIS_URL para la URL de conexión
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// 1. Cliente principal (para cache y operaciones generales)
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, 
  enableOfflineQueue: true, 
  lazyConnect: true,        
});

// 2. Clientes para Publicación/Subscripción (requieren instancias separadas)
export const redisPublisher = new Redis(REDIS_URL);
export const redisSubscriber = new Redis(REDIS_URL);


let connectionReady = false;

redisClient.on('error', (err) => {
  logger.error({ err: err.message }, '[REDIS] Error de conexión');
  connectionReady = false;
});

redisClient.on('connect', () => {
  logger.info('[REDIS] Conectado exitosamente');
  connectionReady = true;
});


/**
 * Verifica la conexión a Redis.
 * @returns {Promise<void>}
 */
export async function assertRedisConnection() {
  if (connectionReady) return;
  try {
    if (redisClient.status !== 'ready' && redisClient.status !== 'connecting') {
        await redisClient.connect(); 
    }
    await redisClient.ping();
  } catch (error) {
    throw new AppError(
      'Redis not reachable',
      503,
      ERR.SERVICE_UNAVAILABLE,
      { cause: error.message }
    );
  }
}

// Exporta un objeto con todas las utilidades para un acceso fácil en los módulos
export default {
  client: redisClient,
  publisher: redisPublisher,
  subscriber: redisSubscriber,
  assertConnection: assertRedisConnection,
};