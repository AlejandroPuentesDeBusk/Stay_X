// src/modules/search/service.js
import { Op, Sequelize, literal } from 'sequelize';
import { getModel } from '../../core/db/registry.js';

// Importar todos los modelos que necesitamos para la búsqueda
const Properties = getModel('properties');
const Amenities = getModel('amenities');
const Rules = getModel('rules');
const Users = getModel('users');

/**
 * Este es el "cerebro" del motor de búsqueda.
 * Construye dinámicamente una consulta compleja de Sequelize
 * basada en los filtros validados.
 */
export async function performSearch(query, pagination) {
  // Obtener la instancia de sequelize desde un modelo
  const sequelize = Properties.sequelize;

  // --- 1. Construir la cláusula WHERE principal ---
  const where = {
    status: 'published', // REGLA: Solo buscar propiedades públicas
    [Op.and]: [], // Array para añadir dinámicamente filtros AND
  };
  
  const replacements = {}; // Para consultas literales seguras

  // --- Filtro de Precio (Rango) ---
  if (query.price_min || query.price_max) {
    const range = {};
    if (query.price_min) range[Op.gte] = query.price_min;
    if (query.price_max) range[Op.lte] = query.price_max;
    where.price_per_month = range;
  }

  // --- Filtro de Texto Completo (q) ---
  if (query.q) {
    // Usamos to_tsvector de PostgreSQL para mejor performance que iLike
    const tsQuery = query.q.trim().split(' ').join(' & ');
    where[Op.and].push(
      literal(`(to_tsvector('spanish', title || ' ' || description || ' ' || address_text) @@ to_tsquery('spanish', :tsQuery))`)
    );
    replacements.tsQuery = tsQuery;
  }

  // --- Filtro Geoespacial (Mapa) ---
  if (query.lat && query.lng) {
    // ST_DWithin usa la distancia en metros (gracias a GEOGRAPHY)
    const point = Sequelize.fn('ST_SetSRID', Sequelize.fn('ST_MakePoint', query.lng, query.lat), 4326);
    where[Op.and].push(
      Sequelize.fn('ST_DWithin', Sequelize.col('location'), point, query.radius_meters)
    );
  }

  // --- Filtro "AND" de Amenidades (Subconsulta) ---
  if (query.amenities && query.amenities.length > 0) {
    // Convertir a un string SQL-seguro (ya validamos que son UUIDs)
    const amenityList = query.amenities.map(id => `'${id}'`).join(',');
    
    where[Op.and].push(literal(
      `"properties"."id" IN (
        SELECT "property_id" FROM "property_amenities"
        WHERE "amenity_id" IN (${amenityList})
        GROUP BY "property_id"
        HAVING COUNT(DISTINCT "amenity_id") = ${query.amenities.length}
      )`
    ));
  }

  // --- Filtro "AND" de Reglas (Subconsulta) ---
  if (query.rules && query.rules.length > 0) {
    const ruleList = query.rules.map(id => `'${id}'`).join(',');
    
    where[Op.and].push(literal(
      `"properties"."id" IN (
        SELECT "property_id" FROM "property_rules"
        WHERE "rule_id" IN (${ruleList})
        GROUP BY "property_id"
        HAVING COUNT(DISTINCT "rule_id") = ${query.rules.length}
      )`
    ));
  }
  
  // Limpiar el array 'and' si está vacío
  if (where[Op.and].length === 0) {
    delete where[Op.and];
  }

  // --- 2. Construir la cláusula INCLUDE (para mostrar) ---
  // Incluimos los datos relacionados para mostrar en los resultados
  const include = [
    {
      model: Users,
      as: 'owner',
      attributes: ['id', 'name', 'is_identity_verified'],
    },
    {
      model: Amenities,
      as: 'amenities',
      attributes: ['id', 'name', 'icon_key'],
      through: { attributes: [] }, // No traer la tabla intermedia
    },
    {
      model: Rules,
      as: 'rules',
      attributes: ['id', 'name', 'icon_key'],
      through: { attributes: [] },
    }
  ];

  // --- 3. Ejecutar la Consulta ---
  const { rows, count } = await Properties.findAndCountAll({
    where,
    include,
    replacements,
    limit: pagination.limit,
    offset: pagination.offset,
    order: [
      // Opcional: Si hay búsqueda geo, ordenar por distancia
      query.lat && query.lng 
        ? [literal(`ST_Distance("location", ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326))`), 'ASC']
        : ['updated_at', 'DESC'] // Default
    ],
    // CRÍTICO: 'distinct' y 'col' son necesarios para que findAndCountAll
    // funcione correctamente con 'include' M2M (amenities/rules)
    distinct: true,
    col: 'id' 
  });

  return { items: rows, total: count };
}