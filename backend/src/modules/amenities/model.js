// src/modules/amenities/model.js
import { DataTypes, UUIDV4 } from 'sequelize';

export const MODEL_NAME = 'amenities';

/**
 * Define el modelo de Amenidades (Catálogo Maestro).
 * Ej. "Piscina", "Wifi", "Gimnasio".
 */
export function defineModel(sequelize) {
  const Amenities = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    // Opcional: un 'slug' o 'icon_name' para el frontend
    icon_key: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Llave para el icono en el frontend (ej. "wifi")'
    }
  }, {
    tableName: MODEL_NAME,
    underscored: true,
    timestamps: true, // Útil saber cuándo se añadió "Pet Friendly v2"
    paranoid: false, // Si se borra, se borra.
    indexes: [
        { unique: true, fields: ['name'] },
        { unique: true, fields: ['icon_key'] }
        ]

  });

  // --- Asociaciones (Muchos-a-Muchos) ---
  Amenities.associate = (models) => {
    Amenities.belongsToMany(models.properties, {
      through: 'property_amenities', // La tabla intermedia
      foreignKey: 'amenity_id',
      otherKey: 'property_id',
      timestamps: false,
    });
  };

  return Amenities;
}
