// src/modules/amenities/validators.js
import { z } from 'zod';

export const AmenitySchema = z.object({
  name: z.string().trim().min(2).max(100),
  icon_key: z.string().trim().min(1).max(50).optional(),
});
