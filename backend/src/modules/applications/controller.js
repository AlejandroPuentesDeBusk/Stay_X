// src/modules/applications/controller.js
import * as service from './service.js';
import { ok, created, noContent } from '../../core/http.js';
import { parsePagination } from '../../core/pagination.js';

/**
 * POST /applications
 * Inquilino: Crea una solicitud.
 */
export const createApplication = async (req, res) => {
  // req.ctx es llenado por requireAuth()
  const application = await service.createApplication(req.body, req.ctx);
  return created(res, application);
};

/**
 * PATCH /applications/:id
 * Arrendador: Aprueba/Rechaza/Cancela una solicitud.
 */
export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  // req.ctx es llenado por requireAuth()
  const application = await service.updateApplicationStatus(id, req.body, req.ctx);
  return ok(res, application);
};

/**
 * GET /applications/my-applications
 * Inquilino: Ve sus solicitudes enviadas.
 */
export const getMyApplications = async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, total } = await service.listMyApplications(req.ctx, {
    pagination,
    query: req.query
  });
  return ok(res, items, { ...pagination, total });
};

/**
 * GET /applications/received
 * Arrendador: Ve las solicitudes recibidas en sus propiedades.
 */
export const getReceivedApplications = async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, total } = await service.listReceivedApplications(req.ctx, {
    pagination,
    query: req.query
  });
  return ok(res, items, { ...pagination, total });
};
