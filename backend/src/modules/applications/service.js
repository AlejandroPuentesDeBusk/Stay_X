// src/modules/applications/service.js
import { Op } from 'sequelize';
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';
import { ROLES } from '../../core/constants.js';

const Applications = getModel('applications');
const Properties = getModel('properties');
const Users = getModel('users');

/**
 * 1. (Inquilino) Crea una nueva solicitud de renta.
 */
export async function createApplication(payload, context) {
  const { property_id } = payload;
  const applicantId = context.userId;

  const property = await Properties.findByPk(property_id);
  if (!property) {
    throw new AppError('La propiedad no existe.', 404, ERR.NOT_FOUND);
  }

  // --- Reglas de Negocio para Aplicar ---

  // 1. La propiedad debe estar 'published'
  if (property.status !== 'published') {
    throw new AppError('Esta propiedad no está disponible para recibir solicitudes.', 409, ERR.CONFLICT);
  }

  // 2. El dueño no puede aplicar a su propia propiedad
  if (property.owner_id === applicantId) {
    throw new AppError('No puedes rentar tu propia propiedad.', 403, ERR.FORBIDDEN);
  }

  // 3. No puede aplicar si ya tiene una solicitud activa (pending, approved, in_agreement)
  const existingApplication = await Applications.findOne({
    where: {
      property_id,
      applicant_id: applicantId,
      status: { [Op.in]: ['pending', 'approved', 'in_agreement'] }
    }
  });

  if (existingApplication) {
    throw new AppError('Ya tienes una solicitud activa para esta propiedad.', 409, ERR.CONFLICT);
  }

  // --- Creación y "Congelación de Precio" ---
  const application = await Applications.create({
    property_id,
    applicant_id: applicantId,
    rent_amount_at_application: property.price_per_month,
    deposit_amount_at_application: property.deposit_amount,
    status: 'pending' // Default
  });

  return application;
}

/**
 * 2. (Arrendador) Actualiza el estado de una solicitud (Aprobar/Rechazar).
 */
export async function updateApplicationStatus(applicationId, payload, context) {
  const arrendadorId = context.userId;
  const { status } = payload;

  const application = await Applications.findByPk(applicationId, {
    include: [{
      model: Properties,
      as: 'property',
      attributes: ['id', 'owner_id'] // Solo necesitamos el owner_id para verificar
    }]
  });

  if (!application) {
    throw new AppError('Solicitud no encontrada.', 404, ERR.NOT_FOUND);
  }

  // --- Reglas de Permiso ---
  // 1. Verificar que el usuario sea el dueño de la propiedad asociada
  if (application.property.owner_id !== arrendadorId) {
    throw new AppError('No tienes permisos para modificar esta solicitud.', 403, ERR.FORBIDDEN);
  }

  // --- Regla de Negocio: "Bloqueo de Acuerdo en Curso" (Tu Regla #2.2) ---
  if (status === 'approved') {
    const existingAgreement = await Applications.findOne({
      where: {
        property_id: application.property_id,
        status: { [Op.in]: ['approved', 'in_agreement'] },
        id: { [Op.ne]: applicationId } // Excluir esta misma solicitud
      }
    });

    if (existingAgreement) {
      throw new AppError(
        'Ya tienes un acuerdo en proceso para esta propiedad. Debes cancelar el actual para poder aceptar uno nuevo.',
        409,
        ERR.CONFLICT
      );
    }
  }

  // Actualizar el estado
  application.status = status;
  await application.save();

  return application;
}

/**
 * 3. (Inquilino) Lista "Mis Solicitudes".
 */
export async function listMyApplications(context, { pagination, query }) {
  const where = { applicant_id: context.userId };
  if (query.status) {
    where.status = query.status;
  }

  const { rows, count } = await Applications.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [['updated_at', 'DESC']],
    include: [{ // Incluir detalles de la propiedad
      model: Properties,
      as: 'property',
      attributes: ['id', 'title', 'cover_image_url', 'address_text']
    }]
  });

  return { items: rows, total: count };
}

/**
 * 4. (Arrendador) Lista "Solicitudes Recibidas" en sus propiedades.
 */
export async function listReceivedApplications(context, { pagination, query }) {
  const where = {};
  if (query.status) {
    where.status = query.status;
  }

  const { rows, count } = await Applications.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [['created_at', 'DESC']],
    include: [
      { // 1. Filtrar por propiedades del Arrendador
        model: Properties,
        as: 'property',
        where: { owner_id: context.userId },
        attributes: ['id', 'title', 'cover_image_url'],
        required: true // INNER JOIN
      },
      { // 2. Incluir detalles del Inquilino (applicant)
        model: Users,
        as: 'applicant',
        attributes: ['id', 'name', 'is_identity_verified'] // Datos públicos del aplicante
      }
    ]
  });

  return { items: rows, total: count };
}