// backend/src/core/context.js

export const attachBaseContext = (req, res, next) => {
  // Ser idempotente - no sobrescribir si ya existe
  if (!req.ctx) {
    req.ctx = {
      requestId: req.id || undefined,
      // ELIMINADO: tenantId: undefined,
      userId: undefined,
      roles: []
    };
  }
  next();
};