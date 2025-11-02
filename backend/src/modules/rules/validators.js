// src/modules/rules/validators.js
import { z } from 'zod';

export const RuleSchema = z.object({
  name: z.string().trim().min(2).max(150),
  icon_key: z.string().trim().min(1).max(50).optional(),
});
