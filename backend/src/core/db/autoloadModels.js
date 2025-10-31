// src/core/db/autoloadModels.js
import fg from 'fast-glob';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
import { DataTypes } from 'sequelize';
import logger from '../logger.js';
import { setModel, getModels } from './registry.js';

 /**
  * Autocarga todos los models desde src/modules/_/model.js
  * Convención por módulo:
  * export function defineModel(sequelize, DataTypes) { return Model; }
  * export function associate(models) { ... } // opcional
  * export const MODEL_NAME = 'mi_modelo';   // opcional
  * Orden:
  * 1) defineModel en todos los módulos (registra modelos)
  * 2) associate en todos los módulos (registra relaciones)
  *
  * @param {import('sequelize').Sequelize} sequelize
  */
export async function autoloadModels(sequelize) {
  try {
    const modelPaths = await fg('src/modules/**/model.js', { dot: false });
    logger.info({ modelPaths }, 'Found module models');

    const modulesMeta = [];

    // 1) Definición de modelos
    for (const modelPath of modelPaths) {
      try {
        const absolutePath = resolve(modelPath);
        const fileUrl = pathToFileURL(absolutePath);
        // --- INICIO DE LA CORRECCIÓN ---
        // Forzamos a Node.js a releer el archivo en desarrollo
        // "Bust the cache"
        let importPath = fileUrl.href;
        if (process.env.NODE_ENV === 'development') {
          importPath = `${fileUrl.href}?v=${Date.now()}`;
        }
        const mod = await import(importPath);
        // --- FIN DE LA CORRECCIÓN ---

        if (typeof mod.defineModel !== 'function') {
          logger.warn({ modelPath }, 'Module model missing defineModel(sequelize, DataTypes)');
          continue;
        }

        const model = await mod.defineModel(sequelize, DataTypes);
        if (!model) {
          logger.warn({ modelPath }, 'defineModel did not return a Sequelize Model');
          continue;
        }

        // Nombre preferente: export MODEL_NAME || model.name
        const preferredName = typeof mod.MODEL_NAME === 'string' && mod.MODEL_NAME.trim()
          ? mod.MODEL_NAME.trim()
          : model.name;

        if (!preferredName) {
          logger.warn({ modelPath }, 'Model has no name; skipping registry');
          continue;
        }

        setModel(preferredName, model);

        modulesMeta.push({
          modelPath,
          name: preferredName,
          associate: typeof mod.associate === 'function' ? mod.associate : null,
        });

        logger.info({ modelPath, name: preferredName }, 'Loaded module model');
      } catch (error) {
        logger.warn({ modelPath, error: error.message }, 'Failed to load module model');
      }
    }

    // 2) Asociaciones
    const models = getModels();
    for (const meta of modulesMeta) {
      if (!meta.associate) continue;
      try {
        meta.associate(models);
        logger.info({ name: meta.name, modelPath: meta.modelPath }, 'Associated model');
      } catch (error) {
        logger.warn({ name: meta.name, error: error.message }, 'Failed to associate model');
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error during model autoload');
  }
}