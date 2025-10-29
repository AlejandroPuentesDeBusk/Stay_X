// src/router/index.js
import { Router } from 'express';
import fg from 'fast-glob';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
import logger from '../core/logger.js';

const router = Router();

/**
 * Carga y monta automáticamente todos los enrutadores de los módulos.
 */
export async function initializeRoutes() {
  try {
    const routerPaths = await fg('src/modules/**/router.js', { dot: false });
    logger.info({ count: routerPaths.length }, 'Buscando enrutadores de módulos...');

    for (const routerPath of routerPaths) {
      try {
        const parts = routerPath.split('/');
        const moduleName = parts[parts.length - 2];

        const fileUrl = pathToFileURL(resolve(routerPath));
        const mod = await import(fileUrl.href);
        const moduleRouter = mod?.default?.router || mod?.default;
        
        // Determina la ruta de montaje: usa la exportada o el nombre de la carpeta
        const mountPath = mod?.default?.mountPath 
          ? (mod.default.mountPath.startsWith('/') ? mod.default.mountPath : `/${mod.default.mountPath}`)
          : `/${moduleName}`;

        if (moduleRouter && typeof moduleRouter === 'function') {
          router.use(mountPath, moduleRouter);
          logger.info({ module: moduleName, path: `/api/v1${mountPath}` }, '✅ Ruta de módulo montada');
        } else {
          logger.warn({ module: moduleName, path: routerPath }, '⚠️ No se encontró un enrutador exportado válido.');
        }
      } catch (err) {
        logger.error({ path: routerPath, error: err.message }, '❌ Error al cargar un enrutador de módulo.');
      }
    }
  } catch (err) {
    logger.error({ error: err.message }, '🚨 Falló el proceso de carga automática de rutas.');
    throw err; // Lanza el error para detener el arranque si la carga falla
  }
  return router;
}