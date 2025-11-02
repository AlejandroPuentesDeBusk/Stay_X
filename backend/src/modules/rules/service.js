// src/modules/rules/service.js
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';

const Rules = getModel('rules');

/** Lista todas las reglas del catálogo. (Público) */
export async function listAll() {
  return Rules.findAll({ order: [['name', 'ASC']] });
}

/** Crea una nueva regla. (Admin) */
export async function create(payload) {
  if (payload.icon_key) {
    const exists = await Rules.findOne({ where: { icon_key: payload.icon_key }});
    if (exists) {
      throw new AppError('La llave de icono (icon_key) ya está en uso.', 409, ERR.CONFLICT);
    }
  }
  return Rules.create(payload);
}

/** Actualiza una regla. (Admin) */
export async function update(id, payload) {
  const rule = await Rules.findByPk(id);
  if (!rule) {
    throw new AppError('Regla no encontrada.', 404, ERR.NOT_FOUND);
  }
  return rule.update(payload);
}

/** Elimina una regla. (Admin) */
export async function remove(id) {
  const deletedCount = await Rules.destroy({ where: { id } });
  if (deletedCount === 0) {
    throw new AppError('Regla no encontrada.', 404, ERR.NOT_FOUND);
  }
}
