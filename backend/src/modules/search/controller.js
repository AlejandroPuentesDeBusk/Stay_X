// src/modules/search/controller.js
import * as searchService from './service.js';
import { ok } from '../../core/http.js';
import { parsePagination } from '../../core/pagination.js';

/**
 * GET /search
 * Orquesta la búsqueda pública de propiedades.
 */
export const searchProperties = async (req, res) => {
  // 1. Obtener paginación (limit, offset)
  const pagination = parsePagination(req.query);
  
  // 2. Los filtros (validados por Zod) están en req.query
  // 3. Pasamos todo al servicio
  const { items, total } = await searchService.performSearch(
    req.query, 
    pagination
  );

  // 4. Devolver la respuesta
  return ok(res, items, { ...pagination, total });
};
