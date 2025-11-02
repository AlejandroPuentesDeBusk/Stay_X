// src/modules/applications/model.js
import { DataTypes, UUIDV4 } from 'sequelize';

export const MODEL_NAME = 'applications';

/**
 * Define el modelo de Solicitudes (Applications).
 * Esta es la "máquina de estados" que orquesta el flujo de renta.
 */
export function defineModel(sequelize) {
  const Applications = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    // --- Llaves Foráneas ---
    // property_id: Se añade en la asociación.
    // applicant_id: Se añade en la asociación.
        // --- INICIO DE LA CORRECCIÓN ---
    // Definir las llaves foráneas explícitamente
    // porque 'property_id' se usa en un índice.
    property_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'properties', // El nombre de la TABLA
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    applicant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // El nombre de la TABLA
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // --- FIN DE LA CORRECCIÓN ---

    // --- Estado del Flujo (Máquina de Estados) ---
    status: {
      type: DataTypes.ENUM(
        'pending',      // 1. Inquilino aplicó
        'approved',     // 2. Arrendador aceptó (Trigger para 'agreements')
        'in_agreement', // 3. 'agreements' y 'payments' están en proceso
        'completed',    // 4. ¡Éxito! Pago y llaves entregadas.
        'rejected',     // 5. Arrendador rechazó
        'cancelled'     // 6. El flujo se canceló (por inquilino o arrendador)
      ),
      allowNull: false,
      defaultValue: 'pending',
    },

    // --- "Congelación de Precios" (Regla de Negocio) ---
    rent_amount_at_application: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'El precio de renta al momento de aplicar.'
    },
    deposit_amount_at_application: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'El depósito requerido al momento de aplicar.'
    },

  }, {
    tableName: MODEL_NAME,
    underscored: true,
    timestamps: true,
    paranoid: true, // Borrado lógico
    indexes: [
      { fields: ['status'] },
      // Índice compuesto para búsquedas comunes
      { fields: ['property_id', 'status'] },
    ]
  });

  // --- Asociaciones ---
  Applications.associate = (models) => {
    // Una solicitud pertenece a una Propiedad
    Applications.belongsTo(models.properties, {
      foreignKey: {
        name: 'property_id',
        allowNull: false,
      },
      as: 'property',
      onDelete: 'CASCADE',
    });

    // Una solicitud pertenece a un Usuario (Inquilino)
    Applications.belongsTo(models.users, {
      foreignKey: {
        name: 'applicant_id',
        allowNull: false,
      },
      as: 'applicant', // Alias 'applicant' en lugar de 'user'
      onDelete: 'CASCADE',
    });
    
    // NOTA: Los modelos 'users' y 'properties' también
    // deberían tener su 'hasMany' correspondiente.
  };

  return Applications;
}
