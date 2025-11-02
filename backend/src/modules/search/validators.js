// src/modules/search/validators.js
import { z } from 'zod';

// Helper para transformar 'uuid1,uuid2' en ['uuid1', 'uuid2']
// También acepta un array si se pasa (ej. ?amenities[]=uuid1)
const CommaSeparatedUuidArray = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val.split(',').filter(Boolean);
    }
    if (Array.isArray(val)) {
      return val.filter(Boolean);
    }
    return [];
  },
  z.array(z.string().uuid("Uno o más IDs en el filtro no son UUIDs válidos"))
);

/**
 * GET /search
 * Esquema de validación para el "super-endpoint" de búsqueda.
 */
export const QuerySearchSchema = z.object({
  // Paginación
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),

  // Búsqueda de Texto
  q: z.string().trim().optional(),

  // Filtros de Rango
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().positive().optional(),

  // Filtros Geoespaciales (para el Mapa)
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_meters: z.coerce.number().positive().default(5000), // Default 5km

  // Filtros de Relación M2M (Lógica "AND")
  amenities: CommaSeparatedUuidArray.optional(),
  rules: CommaSeparatedUuidArray.optional(),

}).superRefine((data, ctx) => {
  // 1. Validar rangos de precio
  if (data.price_min && data.price_max && data.price_max < data.price_min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_max'],
      message: 'El precio máximo no puede ser menor al precio mínimo',
    });
  }

  // 2. Validar Geo-búsqueda
  // Si se proporciona uno (lat o lng), el otro también es requerido.
  if (data.lat && !data.lng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lng'],
      message: 'Se requiere la longitud (lng) si se proporciona la latitud (lat)',
    });
  }
  if (data.lng && !data.lat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lat'],
      message: 'Se requiere la latitud (lat) si se proporciona la longitud (lng)',
    });
  }
});