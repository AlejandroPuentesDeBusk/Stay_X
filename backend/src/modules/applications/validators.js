// src/modules/applications/validators.js
import { z } from 'zod';

// Lista de todos los estados posibles de la máquina
const ApplicationStatusEnum = z.enum([
  'pending',
  'approved',
  'in_agreement',
  'completed',
  'rejected',
  'cancelled'
]);

// Estados que un Arrendador puede asignar manualmente
const ManualUpdateStatusEnum = z.enum([
  'approved', // Inicia el flujo de contrato
  'rejected', // Rechaza la solicitud
  'cancelled' // Cancela un flujo 'pending' o 'approved'
]);

/**
 * POST /applications
 * Inquilino: Crea una nueva solicitud.
 */
export const CreateApplicationSchema = z.object({
  property_id: z.string().uuid('El ID de la propiedad no es válido'),
});

/**
 * PATCH /applications/:id
 * Arrendador: Aprueba, rechaza o cancela una solicitud.
 */
export const UpdateApplicationStatusSchema = z.object({
  status: ManualUpdateStatusEnum,
});

/**
 * GET /applications/my-applications
 * GET /applications/received
 * Esquema de Query para listas (Inquilino y Arrendador).
 */
export const QueryApplicationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: ApplicationStatusEnum.optional(), // Permite filtrar por estado
});
