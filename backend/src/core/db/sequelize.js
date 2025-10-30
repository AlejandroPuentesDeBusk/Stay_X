// src/core/db/sequelize.js

import { Sequelize } from 'sequelize';
import { AppError, ERR } from '../errors.js';
import { env } from '../../config/env.js';
import logger from '../logger.js';
import { autoloadModels } from './autoloadModels.js';
import { getModels } from './registry.js';

// Configurar Sequelize
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  pool: {
    min: 0,
    max: 10,
    acquire: 30000,
    idle: 10000
  },
  logging: (msg) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug({ sql: msg }, 'Database query');
    }
  },
  dialectOptions: env.DATABASE_URL.includes('ssl=true') ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

/**
 * Ejecuta una función dentro de una transacción
 * @param {Function} workFn - Función que recibe { transaction }
 * @returns {Promise<any>} Resultado de la función
 */
export const withTransaction = async (workFn) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await workFn({ transaction });
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Verifica la conexión a la base de datos
 * @throws {AppError} Si no se puede conectar
 */
export const assertDbConnection = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    throw new AppError(
      'Database not reachable',
      503,
      ERR.SERVICE_UNAVAILABLE,
      { cause: error.message }
    );
  }
};

/**
 * Inicializa (una vez) el registro de modelos vía autoload
 * - Define todos los modelos
 * - Corre asociaciones
 */

// Generar modelos en la BD según env DB_SYNC (off|alter|force)
// --- arriba del archivo (después de imports) ---
let modelsLoaded = false; // evita doble autoload
let syncExecuted = false; // <-- AÑADIR NUEVO FLAG

async function initModelAutoload() {
  if (modelsLoaded) return;           // <-- guard
  try {
    await autoloadModels(sequelize);
    const models = getModels();
    const modelNames = Object.keys(models);
    logger.info({ count: modelNames.length, modelNames }, 'Models registered');
    modelsLoaded = true;              // <-- set guard
  } catch (error) {
    logger.error({ error: error.message }, 'Model autoload initialization failed');
  }
}

/** Ejecuta sequelize.sync según DB_SYNC (off|alter|force) */
async function maybeSync() {
  if (syncExecuted) return; // <-- GUARDIA
  const mode = (process.env.DB_SYNC || 'off').toLowerCase();

  // ... (código existente)

  if (mode === 'force') {
    await sequelize.sync({ force: true });
    logger.warn('sequelize.sync({ force: true }) executed (destructive)');
  } else if (mode === 'alter') { // Usar 'else if' aquí
    await sequelize.sync({ alter: true });
    logger.info('sequelize.sync({ alter: true }) executed');
  } else {
    logger.warn({ mode }, 'Unknown DB_SYNC mode; skipping sync');
    return; // Retornar si no se ejecuta sync
  }
  syncExecuted = true; // <-- MARCA COMO EJECUTADO
}


// Autoload en arranque (usar TLA)
if (process.env.DB_AUTOLOAD_MODELS !== 'false') {
  await initModelAutoload();
  await maybeSync();
}

// Export auxiliar para otros sitios que quieran asegurar carga explícita
export const ensureModelsLoaded = async () => {
  await initModelAutoload();
  // Solo sincroniza si el TLA (Top-Level Await) aún no lo hizo
  if (!syncExecuted) { 
    await maybeSync();
  }
};