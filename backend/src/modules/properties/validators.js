// src/modules/properties/validators.js
import { z } from 'zod';

// --- Esquemas Reutilizables ---

/** Estados válidos para una propiedad */
const PropertyStatus = z.enum(['draft', 'published', 'rented']);

/** Esquema para GeoJSON Point (Longitud, Latitud) */
const LocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number())
    .length(2, 'Las coordenadas deben ser [longitud, latitud]')
    .refine(coords => coords[0] >= -180 && coords[0] <= 180, 'Longitud inválida')
    .refine(coords => coords[1] >= -90 && coords[1] <= 90, 'Latitud inválida'),
});

/** Esquema para la galería de medios */
const MediaItemSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url('La URL del medio no es válida'),
});


// --- Esquemas de Endpoints ---

/** POST /properties - Crear una propiedad */
export const CreatePropertySchema = z.object({
  title: z.string().trim().min(5, 'El título es muy corto').max(255),
  description: z.string().trim().optional(),
  address_text: z.string().trim().min(10, 'La dirección es muy corta'),
  location: LocationSchema,
  price_per_month: z.coerce.number().positive('El precio debe ser un número positivo'),
  deposit_amount: z.coerce.number().min(0, 'El depósito no puede ser negativo').default(0),
  cover_image_url: z.string().url('La URL de portada no es válida').optional(),
  media_gallery: z.array(MediaItemSchema).optional().default([]),
});

/** PATCH /properties/:id - Actualizar una propiedad */
export const UpdatePropertySchema = z.object({
  title: z.string().trim().min(5).max(255).optional(),
  description: z.string().trim().optional(),
  address_text: z.string().trim().min(10).optional(),
  location: LocationSchema.optional(),
  price_per_month: z.coerce.number().positive().optional(),
  deposit_amount: z.coerce.number().min(0).optional(),
  cover_image_url: z.string().url().optional(),
  media_gallery: z.array(MediaItemSchema).optional(),
  status: PropertyStatus.optional(), // Permite al dueño publicar o archivar
});

/** GET /properties - Validadores de Query (Público) */
export const QueryPublicPropertiesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  // Aquí se añadirán filtros (precio, amenidades, etc.) en el módulo 'search'
});

/** GET /properties/my-properties - Validadores de Query (Privado) */
export const QueryMyPropertiesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: PropertyStatus.optional(), // Permite al dueño filtrar por status
});

// --- INICIO DE LA MODIFICACIÓN (Validadores de Vínculo) ---

/** POST /properties/:id/amenities */
export const LinkAmenitySchema = z.object({
  amenity_id: z.string().uuid('El ID de la amenidad debe ser un UUID válido'),
});

/** POST /properties/:id/rules */
export const LinkRuleSchema = z.object({
  rule_id: z.string().uuid('El ID de la regla debe ser un UUID válido'),
});

// --- FIN DE LA MODIFICACIÓN ---
