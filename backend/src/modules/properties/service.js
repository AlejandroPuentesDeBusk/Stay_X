// src/modules/properties/service.js
import { Op } from 'sequelize';
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';
import { ROLES } from '../../core/constants.js';

const Properties = getModel('properties');
const Users = getModel('users');
// --- INICIO DE LA MODIFICACIÓN (Importar Catálogos) ---
const Amenities = getModel('amenities');
const Rules = getModel('rules');
// --- FIN DE LA MODIFICACIÓN ---

// --- Helpers de Autorización ---

/**
 * Verifica si el usuario actual es el dueño de la propiedad o un admin.
 * Lanza un error 403 (Forbidden) si no lo es.
 * @param {object} property - La instancia de la propiedad de Sequelize.
 * @param {object} context - El objeto req.ctx (con userId y roles).
 */
function authorizeOwnerOrAdmin(property, context) {
  const isOwner = property.owner_id === context.userId;
  const isAdmin = context.roles.includes(ROLES.admin);

  if (!isOwner && !isAdmin) {
    throw new AppError(
      'No tienes permisos para modificar este recurso.',
      403,
      ERR.FORBIDDEN
    );
  }
}

/**
 * Busca una propiedad por ID y verifica los permisos de lectura.
 * Oculta borradores ('draft') a usuarios no autorizados.
 * @param {string} id - UUID de la propiedad.
 * @param {object} context - El objeto req.ctx (opcional).
 */
export async function getPropertyById(id, context = {}) {
  const property = await Properties.findByPk(id, {
    include: [
      {
        model: Users,
        as: 'owner',
        attributes: ['id', 'name', 'is_identity_verified'], // Solo exponer datos públicos del dueño
      },
      // --- INICIO DE LA MODIFICACIÓN (Incluir catálogos) ---
      {
        model: Amenities,
        as: 'amenities',
        attributes: ['id', 'name', 'icon_key'],
        through: { attributes: [] } // No incluir la tabla intermedia
      },
      {
        model: Rules,
        as: 'rules',
        attributes: ['id', 'name', 'icon_key'],
        through: { attributes: [] }
      }
      // --- FIN DE LA MODIFICACIÓN ---
    ]
  });

  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }

  // Lógica de visibilidad:
  // 1. Si está 'published', es pública.
  if (property.status === 'published') {
    return property;
  }

  // 2. Si es 'draft' o 'rented', solo el dueño o admin puede verla.
  // Ocultamos su existencia (404) si el usuario no está autenticado
  if (!context.userId) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }
  
  const isOwner = property.owner_id === context.userId;
  const isAdmin = context.roles.includes(ROLES.admin);

  if (isOwner || isAdmin) {
    return property;
  }

  // Si no es dueño/admin y la propiedad no es pública, ocultar (404).
  throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
}

/**
 * Lista propiedades públicas (para el marketplace).
 */
export async function listPublic({ pagination }) {
  const { rows, count } = await Properties.findAndCountAll({
    where: {
      status: 'published',
      // is_property_verified: true, // Opcional: ¿Solo mostrar si StayX ya la verificó?
    },
    limit: pagination.limit,
    offset: pagination.offset,
    order: [['created_at', 'DESC']],
    include: [{
      model: Users,
      as: 'owner',
      attributes: ['id', 'name', 'is_identity_verified'],
    }]
  });

  return { items: rows, total: count };
}

/**
 * Lista las propiedades de un arrendador específico (para su panel "Mis Publicaciones").
 */
export async function listByOwner(ownerId, { pagination, query }) {
  const where = { owner_id: ownerId };

  if (query.status) {
    where.status = query.status;
  }

  const { rows, count } = await Properties.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [['updated_at', 'DESC']],
    // No necesitamos incluir al 'owner' aquí, ya que es el mismo usuario.
  });

  return { items: rows, total: count };
}


/**
 * Crea una nueva propiedad (como 'draft').
 * @param {object} payload - Datos validados por Zod.
 * @param {object} context - req.ctx (requerido para ownerId y verificación).
 */
export async function createProperty(payload, context) {
  // REGLA DE NEGOCIO: Solo arrendadores con identidad verificada pueden crear.
  const user = await Users.findByPk(context.userId);
  if (!user || !user.is_identity_verified) {
    throw new AppError(
      'Debes verificar tu identidad (KYC) antes de poder publicar propiedades.',
      403,
      ERR.FORBIDDEN
    );
  }

  // El 'status' por defecto es 'draft' (definido en el modelo).
  const property = await Properties.create({
    ...payload,
    owner_id: context.userId,
  });

  return property;
}

/**
 * Actualiza una propiedad (dueño o admin).
 */
export async function updateProperty(id, payload, context) {
  const property = await Properties.findByPk(id);
  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }

  // REGLA DE PERMISOS: Solo dueño o admin.
  authorizeOwnerOrAdmin(property, context);

  // REGLA DE NEGOCIO: No se puede cambiar el status si está rentada (ej. a 'draft').
  if (property.status === 'rented' && payload.status && payload.status !== 'rented') {
     throw new AppError(
      'No puedes cambiar el estado de una propiedad con una renta activa.',
      409,
      ERR.CONFLICT
    );
  }

  await property.update(payload);
  return property;
}

/**
 * Elimina una propiedad (dueño o admin).
 */
export async function deleteProperty(id, context) {
  const property = await Properties.findByPk(id);
  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }

  // REGLA DE PERMISOS: Solo dueño o admin.
  authorizeOwnerOrAdmin(property, context);

  // REGLA DE NEGOCIO: No se puede eliminar si está rentada.
  if (property.status === 'rented') {
    throw new AppError(
      'No puedes eliminar una propiedad que tiene una renta activa. Debes finalizar el contrato primero.',
      403,
      ERR.FORBIDDEN
    );
  }

  // Borrado lógico (paranoid: true)
  await property.destroy();
}


// --- INICIO DE LA MODIFICACIÓN (Servicios de Vínculo) ---

/**
 * Vincula una Amenidad a una Propiedad. (Dueño o Admin)
 */
export async function addAmenityToProperty(propertyId, amenityId, context) {
  const property = await Properties.findByPk(propertyId);
  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }
  authorizeOwnerOrAdmin(property, context);

  const amenity = await Amenities.findByPk(amenityId);
  if (!amenity) {
    throw new AppError('Amenidad no encontrada.', 404, ERR.NOT_FOUND);
  }

  // Usamos el "magic method" de Sequelize
  await property.addAmenity(amenity);
}

/**
 * Desvincula una Amenidad de una Propiedad. (Dueño o Admin)
 */
export async function removeAmenityFromProperty(propertyId, amenityId, context) {
  const property = await Properties.findByPk(propertyId);
  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }
  authorizeOwnerOrAdmin(property, context);

  // Usamos el "magic method" de Sequelize
  await property.removeAmenity(amenityId);
}

/**
 * Vincula una Regla a una Propiedad. (Dueño o Admin)
 */
export async function addRuleToProperty(propertyId, ruleId, context) {
  const property = await Properties.findByPk(propertyId);
  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }
  authorizeOwnerOrAdmin(property, context);

  const rule = await Rules.findByPk(ruleId);
  if (!rule) {
    throw new AppError('Regla no encontrada.', 404, ERR.NOT_FOUND);
  }

  await property.addRule(rule);
}

/**
 * Desvincula una Regla de una Propiedad. (Dueño o Admin)
 */
export async function removeRuleFromProperty(propertyId, ruleId, context) {
  const property = await Properties.findByPk(propertyId);
  if (!property) {
    throw new AppError('Propiedad no encontrada.', 404, ERR.NOT_FOUND);
  }
  authorizeOwnerOrAdmin(property, context);

  await property.removeRule(ruleId);
}
// --- FIN DE LA MODIFICACIÓN ---

