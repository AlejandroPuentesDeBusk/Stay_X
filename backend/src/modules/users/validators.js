// backend/src/modules/users/validators.js
import { z } from 'zod';
import { ROLES } from '../../core/constants.js';

// Roles permitidos para ser asignados o buscados (excluye 'system')
const AssignableRoles = z.enum([ROLES.admin, ROLES.arrendador, ROLES.arrendatario]);

export const CreateUserSchema = z.object({
  email: z.string().email().max(160).trim(),
  password: z.string().min(8).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  // Permite asignar un rol al crear, pero por defecto es arrendatario (solo admin debería usar esto)
  role: AssignableRoles.optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().max(160).trim().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  role: AssignableRoles.optional(),
  // No permitir actualizar identity_id o is_identity_verified manualmente
});

export const QueryUserSchema = z.object({
  q: z.string().max(200).optional(),
  role: AssignableRoles.optional(),
  is_verified: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});