// src/modules/amenities/service.js
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';

const Amenities = getModel('amenities');

/** Lista todas las amenidades del catálogo. (Público) */
export async function listAll() {
  return Amenities.findAll({ order: [['name', 'ASC']] });
}

/** Crea una nueva amenidad. (Admin) */
export async function create(payload) {
  // Opcional: Verificar unicidad de icon_key si existe
  if (payload.icon_key) {
    const exists = await Amenities.findOne({ where: { icon_key: payload.icon_key }});
    if (exists) {
      throw new AppError('La llave de icono (icon_key) ya está en uso.', 409, ERR.CONFLICT);
    }
  }
  return Amenities.create(payload);
}

/** Actualiza una amenidad. (Admin) */
export async function update(id, payload) {
  const amenity = await Amenities.findByPk(id);
  if (!amenity) {
    throw new AppError('Amenidad no encontrada.', 404, ERR.NOT_FOUND);
  }
  return amenity.update(payload);
}

/** Elimina una amenidad. (Admin) */
export async function remove(id) {
  const deletedCount = await Amenities.destroy({ where: { id } });
  if (deletedCount === 0) {
    throw new AppError('Amenidad no encontrada.', 404, ERR.NOT_FOUND);
  }
}
