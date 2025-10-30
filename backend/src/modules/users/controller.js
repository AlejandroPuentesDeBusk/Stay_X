// backend/src/modules/users/controller.js
import * as userService from './service.js';
import { ok, created, noContent } from '../../core/http.js';
import { parsePagination } from '../../core/pagination.js';

// --- Rutas de Lectura y Listado ---

/** GET /users */
export const listUsers = async (req, res) => {
  const pagination = parsePagination(req.query); //
  
  const { items, total } = await userService.listAllUsers({ 
    query: req.query, 
    pagination 
  });

  return ok(res, { items, total }, { ...pagination, total }); //
};

/** GET /users/:id */
export const getUser = async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  return ok(res, { user }); //
};

// --- Rutas de Escritura (Solo para Admin) ---

/** POST /users */
export const createUser = async (req, res) => {
  const user = await userService.createUserService(req.body);
  return created(res, { user }); //
};

/** PATCH /users/:id */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const user = await userService.updateUserService(id, req.body);
  return ok(res, { user }); //
};

/** DELETE /users/:id */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  await userService.deleteUserService(id);
  return noContent(res); //
};