// backend/src/modules/users/service.js
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';
import { ROLES } from '../../core/constants.js';

const Users = getModel('users');

/**
 * Función genérica para construir la cláusula WHERE para buscar usuarios.
 */
function buildUserWhereClause(query) {
  const where = {};
  
  // Búsqueda por palabra clave (nombre, email, phone)
  if (query.q) {
    const q = `%${query.q.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: q } },
      { email: { [Op.iLike]: q } },
      { phone: { [Op.iLike]: q } },
    ];
  }
  
  // Filtrado por rol
  if (query.role) {
    where.role = query.role;
  }
  
  // Filtrado por status de verificación
  if (query.is_verified) {
    where.is_identity_verified = query.is_verified === 'true';
  }

  return where;
}

/**
 * Busca y cuenta todos los usuarios con paginación y filtros.
 */
export async function listAllUsers({ query, pagination }) {
  const where = buildUserWhereClause(query);

  const { rows, count } = await Users.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [[pagination.sortBy || 'created_at', pagination.sortDir || 'desc']],
    // Excluir hash de contraseña y secretos 2FA
    attributes: { exclude: ['password_hash', 'two_factor_secret'] },
  });

  return { items: rows, total: count };
}

/**
 * Obtiene un usuario por ID.
 */
export async function getUserById(userId) {
  const user = await Users.findByPk(userId, {
    attributes: { exclude: ['password_hash', 'two_factor_secret'] },
  });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, ERR.NOT_FOUND);
  }
  return user;
}

/**
 * Actualiza un usuario.
 */
export async function updateUserService(userId, payload) {
  const user = await Users.findByPk(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, ERR.NOT_FOUND);
  }

  // Lógica de negocio: Si cambia el email, validar unicidad
  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const exists = await Users.findOne({ where: { email: payload.email.toLowerCase() } });
    if (exists) {
      throw new AppError('El correo ya está registrado.', 409, ERR.CONFLICT);
    }
  }

  // Lógica de negocio: No permitir que un usuario pierda su rol de arrendador si ya lo tiene.
  // (Aunque esto se maneja mejor en un módulo de "solicitudes de rol")
  
  await user.update(payload);
  
  // Devuelve la versión limpia
  const updatedUser = await Users.findByPk(userId, {
    attributes: { exclude: ['password_hash', 'two_factor_secret'] },
  });

  return updatedUser;
}

/**
 * Crea un nuevo usuario (Usado solo por el Admin o en el proceso de Registro).
 */
export async function createUserService(payload) {
  // Nota: La validación de unicidad de email es manejada por la DB (unique: true)

  const defaultRole = ROLES.arrendatario;
  const userRole = payload.role || defaultRole;

  // Si se proporciona contraseña, hashearla
  if (payload.password) {
    const salt = await bcrypt.genSalt(12);
    payload.password_hash = await bcrypt.hash(payload.password, salt);
    delete payload.password; // Eliminar el campo de texto plano
  }
  
  const user = await Users.create({
    ...payload,
    role: userRole,
    // Aseguramos que la verificación de identidad sea falsa por defecto.
    is_identity_verified: false, 
  });

  // Devuelve la versión limpia
  const newUser = await Users.findByPk(user.id, {
    attributes: { exclude: ['password_hash', 'two_factor_secret'] },
  });
  
  return newUser;
}

/**
 * Elimina un usuario por ID (borrado lógico por paranoid: true).
 */
export async function deleteUserService(userId) {
  const deletedCount = await Users.destroy({ 
    where: { id: userId } 
  });
  
  if (deletedCount === 0) {
    throw new AppError('Usuario no encontrado', 404, ERR.NOT_FOUND);
  }
  // NoContent (204) es manejado por el controller.
}