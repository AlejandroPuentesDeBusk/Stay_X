// src/server.js
import { createServer } from 'http';
import { env } from './config/env.js';
import { createApp } from './app.js';
import logger from './core/logger.js';
import { ensureModelsLoaded } from './core/db/sequelize.js';
import { initializeRoutes } from './router/index.js'; // ⬅️ 1. IMPORTA LA FUNCIÓN
import 'express-async-errors';

// SE MUEVE LA CREACIÓN DE APP DENTRO DE LA FUNCIÓN ASÍNCRONA
// const app = createApp(); 
const server = createServer();

(async () => {
  try {
    // 1) Carga modelos y sincroniza la DB
    await ensureModelsLoaded();
    logger.info('Database and models initialized.');

    // 2) ⬅️ INICIALIZA LAS RUTAS Y ESPERA
    const mainRouter = await initializeRoutes();
    logger.info('All routes have been initialized.');

    // 3) ⬅️ CREA LA APP Y PASA EL ENRUTADOR
    const app = createApp(mainRouter);
    server.on('request', app); // Asocia la app al servidor

    // 4) Escuchar en el puerto
    server.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: process.env.NODE_ENV || 'development',
        },
        `✅ Server running on port ${env.PORT}`
      );
    });

  } catch (err) {
    logger.error({ err }, 'Failed to initialize application');
    process.exit(1);
  }
})();

// Graceful shutdown (sin cambios)
const gracefulShutdown = (signal) => {
  logger.info({ signal }, 'Received shutdown signal, closing server gracefully');
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Force shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error({ error: err }, 'Unhandled Promise Rejection');
  gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ error: err }, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});