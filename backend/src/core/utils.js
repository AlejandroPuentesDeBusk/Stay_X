// src/core/utils.js

/**
 * Convierte un valor a un entero de forma segura.
 * @param {any} value El valor a convertir.
 * @param {number} fallback El valor por defecto si la conversión falla.
 * @returns {number}
 */
export function toInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Convierte un valor a un booleano de forma segura.
 * @param {any} value El valor a convertir.
 * @param {boolean} fallback El valor por defecto si la conversión falla.
 * @returns {boolean}
 */
export function toBool(value, fallback = false) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return fallback;
}

/**
 * Limpia un ID, eliminando espacios.
 * @param {any} value El valor a sanitizar.
 * @returns {string}
 */
export function sanitizeId(value) {
    if (typeof value === 'string') {
        return value.trim();
    }
    return '';
}