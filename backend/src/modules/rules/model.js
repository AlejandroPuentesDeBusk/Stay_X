// src/modules/rules/model.js
import { DataTypes, UUIDV4 } from 'sequelize';

export const MODEL_NAME = 'rules';

/**
 * Define el modelo de Reglas (Catálogo Maestro).
 * Ej. "No mascotas", "No fumar", "Solo mujeres".
 */
export function defineModel(sequelize) {
  const Rules = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    // Opcional: un 'slug' o 'icon_name' para el frontend
    icon_key: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Llave para el icono en el frontend (ej. "no-pets")'
    }
  }, {
    tableName: MODEL_NAME,
    underscored: true,
    timestamps: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ['name'] },
      { unique: true, fields: ['icon_key'] }
    ]

  });

  // --- Asociaciones (Muchos-a-Muchos) ---
  Rules.associate = (models) => {
    Rules.belongsToMany(models.properties, {
      through: 'property_rules', // La tabla intermedia
      foreignKey: 'rule_id',
      otherKey: 'property_id',
      timestamps: false,
    });
  };

  return Rules;
}
