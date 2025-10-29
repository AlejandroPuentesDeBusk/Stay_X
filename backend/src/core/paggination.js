// backend/src/core/pagination.js
/**
 * Utilidades de paginación
 */

export const parsePagination = (query) => {
  const result = {
    limit: 50,
    offset: 0,
    sortBy: undefined,
    sortDir: 'asc'
  };

  // Parse limit
  if (query.limit) {
    const limit = parseInt(query.limit, 10);
    if (!isNaN(limit) && limit >= 1 && limit <= 100) {
      result.limit = limit;
    }
  }

  // Parse offset
  if (query.offset) {
    const offset = parseInt(query.offset, 10);
    if (!isNaN(offset) && offset >= 0) {
      result.offset = offset;
    }
  }

  // Parse sortBy
  if (query.sortBy && typeof query.sortBy === 'string') {
    result.sortBy = query.sortBy;
  }

  // Parse sortDir
  if (query.sortDir && (query.sortDir === 'asc' || query.sortDir === 'desc')) {
    result.sortDir = query.sortDir;
  }

  return result;
};