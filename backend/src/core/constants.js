// backend/src/core/constants.js
/**
 * Constantes de la aplicación
 */

export const ROLES = {
  admin: 'admin',      // Administrador de StayX
  arrendador: 'arrendador',  // Propietario/Landlord
  arrendatario: 'arrendatario', // Inquilino/Renter
  member: 'member',    // Rol genérico (útil para usuarios sin rol asignado aún)
  viewer: 'viewer',    // Rol de solo lectura (útil para empleados de StayX)
  system: 'system'     // Rol para tokens de servicio/backend (CRÍTICO)
};

export const HEADERS = {
  REQUEST_ID: 'x-request-id',
  // ELIMINADO: TENANT_ID
  IDEMPOTENCY: 'x-idempotency-key'
};