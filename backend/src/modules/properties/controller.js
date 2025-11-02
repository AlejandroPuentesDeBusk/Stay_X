// src/modules/properties/controller.js
import * as propertyService from './service.js';
import { ok, created, noContent } from '../../core/http.js';
import { parsePagination } from '../../core/pagination.js';

/**
 * GET /properties
 * Lista propiedades públicas (Marketplace).
 */
export const listPublicProperties = async (req, res) => {
  const pagination = parsePagination(req.query);
  
  const { items, total } = await propertyService.listPublic({ 
    pagination 
  });

  return ok(res, items, { ...pagination, total });
};

/**
 * GET /properties/my-properties
 * Lista propiedades del usuario autenticado (Arrendador).
 */
export const listMyProperties = async (req, res) => {
  const pagination = parsePagination(req.query);
  const ownerId = req.ctx.userId; // De requireAuth()

  const { items, total } = await propertyService.listByOwner(ownerId, {
    pagination,
    query: req.query // Pasa el query para filtros (ej. status)
  });

  return ok(res, items, { ...pagination, total });
};

/**
 * GET /properties/:id
 * Obtiene una propiedad (Público, pero oculta borradores).
 */
export const getProperty = async (req, res) => {
  const { id } = req.params;
  // Pasamos req.ctx (que puede tener un usuario o no) para la lógica de visibilidad
  const property = await propertyService.getPropertyById(id, req.ctx);
  return ok(res, property);
};

/**
 * POST /properties
 * Crea una nueva propiedad (requiere Arrendador verificado).
 */
export const createProperty = async (req, res) => {
  // req.ctx es llenado por requireAuth() y requireRoles()
  const property = await propertyService.createProperty(req.body, req.ctx);
  return created(res, property);
};

/**
 * PATCH /properties/:id
 * Actualiza una propiedad (requiere ser dueño o admin).
 */
export const updateProperty = async (req, res) => {
  const { id } = req.params;
  // req.ctx es llenado por requireAuth()
  const property = await propertyService.updateProperty(id, req.body, req.ctx);
  return ok(res, property);
};

/**
 * DELETE /properties/:id
 * Elimina una propiedad (requiere ser dueño o admin).
 */
export const deleteProperty = async (req, res) => {
  const { id } = req.params;
  // req.ctx es llenado por requireAuth()
  await propertyService.deleteProperty(id, req.ctx);
  return noContent(res);
};