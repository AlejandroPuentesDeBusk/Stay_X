// backend/src/core/redis.js
import { Redis } from 'ioredis';
import logger from '../logger.js';
import { AppError, ERR } from '../errors.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions = {
  maxRetriesPerRequest: null, 
  enableOfflineQueue: true, 
  lazyConnect: true, // Dejamos que 'lazy' sea true para el cliente principal
};

// 1. Cliente principal (para cache y operaciones generales)
export const redisClient = new Redis(REDIS_URL, redisOptions);

// --- INICIO DE LA CORRECCIÓN (Redis is already connecting) ---
// Para Pub/Sub, SÍ queremos que se conecten al inicio.
// 'lazyConnect: false' les dice que se conecten ahora.
const pubSubOptions = {
  ...redisOptions,
  lazyConnect: false, // <-- Esta es la corrección
};

export const redisPublisher = new Redis(REDIS_URL, pubSubOptions);
export const redisSubscriber = new Redis(REDIS_URL, pubSubOptions);
// --- FIN DE LA CORRECCIÓN ---


let connectionReady = false;

redisClient.on('error', (err) => {
  logger.error({ err: err.message }, '[REDIS-Client] Error de conexión');
  connectionReady = false;
});
redisClient.on('connect', () => {
  logger.info('[REDIS-Client] Conectado exitosamente');
  connectionReady = true;
});

// --- INICIO DE LA MODIFICACIÓN (Remover conexión manual) ---
// Monitorear los clientes Pub/Sub
redisPublisher.on('error', (err) => {
  logger.error({ err: err.message }, '[REDIS-Publisher] Error de conexión');
});
redisPublisher.on('connect', () => {
  logger.info('[REDIS-Publisher] Conectado exitosamente');
});

redisSubscriber.on('error', (err) => {
  logger.error({ err: err.message }, '[REDIS-Subscriber] Error de conexión');
});
redisSubscriber.on('connect', () => {
  logger.info('[REDIS-Subscriber] Conectado exitosamente');
});

// ELIMINAMOS la función connectPubSub() que causaba la condición de carrera
// --- FIN DE LA MODIFICACIÓN ---


/**
 * Verifica la conexión a Redis (Cliente principal).
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

export default {
  client: redisClient,
  publisher: redisPublisher,
  subscriber: redisSubscriber,
  assertConnection: assertRedisConnection,
};
