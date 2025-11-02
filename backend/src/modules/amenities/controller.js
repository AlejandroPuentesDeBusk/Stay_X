// src/modules/amenities/controller.js
import * as service from './service.js';
import { ok, created, noContent } from '../../core/http.js';

/** GET /amenities - Lista todas (Público) */
export const list = async (req, res) => {
  const items = await service.listAll();
  return ok(res, items);
};

/** POST /amenities - Crea una (Admin) */
export const create = async (req, res) => {
  const item = await service.create(req.body);
  return created(res, item);
};

/** PATCH /amenities/:id - Actualiza (Admin) */
export const update = async (req, res) => {
  const item = await service.update(req.params.id, req.body);
  return ok(res, item);
};

/** DELETE /amenities/:id - Elimina (Admin) */
export const remove = async (req, res) => {
  await service.remove(req.params.id);
  return noContent(res);
};
