// src/auth/jwt.js
import jwt from 'jsonwebtoken';

/** Defaults desde ENV para no romper llamados existentes si omites options */
const {
  JWT_SECRET = 'replace_me_with_a_long_secret',
  JWT_ISSUER = 'my-issuer',
  JWT_AUDIENCE = 'my-audience',
  JWT_ACCESS_EXPIRES = '15m',
  JWT_REFRESH_EXPIRES = '30d',
} = process.env;

/**
 * Helper: extrae el token Bearer de un Authorization header.
 * @param {string|undefined} authorizationHeader
 * @returns {string|null}
 */
export const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) return null;
  return authorizationHeader.substring(7);
};

/**
 * Verifica un token JWT y extrae los claims desde un Authorization header.
 * Mantiene compatibilidad: devuelve null si es inválido.
 * @param {string} authorizationHeader - "Bearer <token>"
 * @param {object} options - { secret, issuer, audience }
 * @returns {object|null} { userId, roles } | null
 */
export const verifyJwt = (authorizationHeader, { secret, issuer, audience } = {}) => {
  const token = getBearerToken(authorizationHeader);
  if (!token) return null;
  try {
    const verifyOpts = {};
    if (issuer) verifyOpts.issuer = issuer;
    if (audience) verifyOpts.audience = audience;

    const payload = jwt.verify(token, secret || JWT_SECRET, verifyOpts);
    return {
      userId: payload.sub,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      // ELIMINADO: tenantId: payload.tid,
    };
  } catch {
    return null;
  }
};

/**
 * Verifica un JWT crudo (ya extraído) y retorna el payload completo o null.
 * Útil para flujos basados en cookies (refresh).
 * @param {string} token
 * @param {{secret?:string, issuer?:string, audience?:string}} opts
 * @returns {object|null}
 */
export const verifyRawJwt = (token, { secret, issuer, audience } = {}) => {
  if (!token) return null;
  try {
    const verifyOpts = {};
    if (issuer || JWT_ISSUER) verifyOpts.issuer = issuer || JWT_ISSUER;
    if (audience || JWT_AUDIENCE) verifyOpts.audience = audience || JWT_AUDIENCE;
    return jwt.verify(token, secret || JWT_SECRET, verifyOpts);
  } catch {
    return null;
  }
};

/** Normaliza claims para aceptar tanto {userId,roles} como {sub,roles}. */
function normalizeClaims(input = {}) {
  const {
    userId, roles,
    sub,
  } = input;

  return {
    userId: userId ?? sub,
    roles: Array.isArray(roles) ? roles : (input.roles ? [input.roles].flat().filter(Boolean) : []),
    // ELIMINADO: tenantId/tid
  };
}

/**
 * Firma un JWT genérico (privado). Usa sub/roles para mantener compatibilidad con verifyJwt.
 * @param {{userId?:string, roles?:string[]}|{sub?:string, roles?:string[]}} claims
 * @param {{type?:'access'|'refresh'|'system', expiresIn?:string, secret?:string, issuer?:string, audience?:string, extra?:object}} opts
 * @returns {string} JWT
 */
const signToken = (
  claims,
  { type = 'access', expiresIn, secret, issuer, audience, extra = {} } = {}
) => {
  const norm = normalizeClaims(claims);
  if (!norm.userId) {
    throw new Error('signToken: userId/sub es requerido');
  }

  const payload = {
    sub: norm.userId,
    // ELIMINADO: tid: norm.tenantId, 
    roles: norm.roles || [],
    tokenType: type, // útil para distinguir en refresh/system
    ...extra,
  };
  
  // ⬇️ LÓGICA AGREGADA PARA LA EXPIRACIÓN POR TIPO
  let defaultExpiration = JWT_ACCESS_EXPIRES;
  if (type === 'refresh') {
    defaultExpiration = JWT_REFRESH_EXPIRES;
  } else if (type === 'system') {
    defaultExpiration = '10y'; // 10 años por defecto para tokens de sistema
  }

  const signOpts = {
    algorithm: 'HS256',
    expiresIn: expiresIn || defaultExpiration, // Usa la expiración calculada
    issuer: issuer || JWT_ISSUER,
    audience: audience || JWT_AUDIENCE,
  };

  return jwt.sign(payload, secret || JWT_SECRET, signOpts);
};

/**
 * Emite un Access Token (15m por defecto)
 * @param {{userId?:string, roles?:string[]}|{sub?:string, roles?:string[]}} claims
 * @param {{expiresIn?:string, secret?:string, issuer?:string, audience?:string, extra?:object}} opts
 * @returns {string}
 */
export const signAccess = (claims, opts = {}) =>
  signToken(claims, { ...opts, type: 'access' });

/**
 * Emite un Refresh Token (30d por defecto)
 * @param {{userId?:string, roles?:string[]}|{sub?:string, roles?:string[]}} claims
 * @param {{expiresIn?:string, secret?:string, issuer?:string, audience?:string, extra?:object}} opts
 * @returns {string}
 */
export const signRefresh = (claims, opts = {}) =>
  signToken(claims, { ...opts, type: 'refresh' });

/**
 * Emite un Token de Sistema (10 años por defecto)
 * @param {{userId?:string, roles?:string[]}|{sub?:string, roles?:string[]}} claims
 * @param {{expiresIn?:string, secret?:string, issuer?:string, audience?:string, extra?:object}} opts
 * @returns {string}
 */
export const signSystemToken = (claims, opts = {}) =>
  signToken(claims, { ...opts, type: 'system' });