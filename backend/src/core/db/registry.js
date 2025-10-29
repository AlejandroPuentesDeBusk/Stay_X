// src/core/db/registry.js
const modelsMap = new Map();

/**
 * Registra un modelo en el mapa
 * @param {string} name
 * @param {import('sequelize').Model} model
 */
export function setModel(name, model) {
  modelsMap.set(name, model);
}

/** Obtiene un modelo por nombre (o undefined) */
export function getModel(name) {
  return modelsMap.get(name);
}
                        
/** Obtiene todos los modelos como objeto plano { [name]: model } */
export function getModels() {
  return Object.fromEntries(modelsMap.entries());
}

/** Limpia el registro (útil en tests) */
export function clearModels() {
  modelsMap.clear();
}