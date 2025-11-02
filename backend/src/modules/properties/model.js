// src/modules/properties/model.js
import { DataTypes, UUIDV4, Op } from 'sequelize';

export const MODEL_NAME = 'properties';

/**
 * Define el modelo de Propiedades.
 * Este es el núcleo del marketplace.
 */
export function defineModel(sequelize) {
  const Properties = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    // --- Llaves Foráneas ---
    // owner_id: Se añade en la asociación.

    // --- Detalles Básicos ---
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // --- Ubicación ---
    address_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'La dirección textual legible (ej. "Calle Falsa 123, Zapopan").'
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: true,
      comment: 'Coordenadas GeoJSON [long, lat] para PostGIS.'
    },

    // --- Precios ---
    price_per_month: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      }
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Monto del depósito (puede ser 0 si no se requiere).'
    },

    // --- Multimedia (GCS) ---
    cover_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      }
    },
    media_gallery: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array de URLs de GCS: [{ type: "image", url: "..." }, { type: "video", url: "..." }]'
    },

    // --- Estado y Verificación (Flujo de Publicación) ---
    status: {
      type: DataTypes.ENUM('draft', 'published', 'rented'),
      allowNull: false,
      defaultValue: 'draft',
    },
    is_property_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True si StayX Admin validó los documentos de la propiedad.'
    },
    
  }, {
    tableName: MODEL_NAME,
    underscored: true,
    timestamps: true,
    paranoid: true, // Habilita borrado lógico
    indexes: [
      // Índice geoespacial para búsquedas de mapas
      { fields: ['location'], using: 'gist' }, 
      // Índice para buscar por estado
      { fields: ['status'] },
    ]
  });

  // --- Asociaciones ---
  Properties.associate = (models) => {
    // Una propiedad pertenece a un único usuario (Arrendador)
    Properties.belongsTo(models.users, {
      foreignKey: {
        name: 'owner_id',
        allowNull: false,
      },
      as: 'owner',
      onDelete: 'CASCADE',
    });

    // Las relaciones M2M (amenities, rules) se definirán
    // en los modelos 'amenities' y 'rules' cuando se creen.
  };

  return Properties;
}