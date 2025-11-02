// src/modules/conversations/model.js
import { DataTypes, UUIDV4 } from 'sequelize';

export const MODEL_NAME = 'conversations';

export function defineModel(sequelize) {
  const Conversations = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    // --- CORRECCIÓN DE ERROR (Column "property_id" does not exist) ---
    // Definimos las llaves foráneas explícitamente para los índices.
    property_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' },
      onDelete: 'CASCADE',
    },
    applicant_id: { // El Inquilino
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    owner_id: { // El Arrendador
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    // --- FIN DE LA CORRECCIÓN ---
  }, {
    tableName: 'conversations',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      // Este índice AHORA SÍ funcionará
      {
        unique: true,
        fields: ['property_id', 'applicant_id'],
      },
      { fields: ['applicant_id'] },
      { fields: ['owner_id'] },
    ]
  });

  Conversations.associate = (models) => {
    Conversations.belongsTo(models.properties, { foreignKey: 'property_id', as: 'property' });
    Conversations.belongsTo(models.users, { foreignKey: 'applicant_id', as: 'applicant' });
    Conversations.belongsTo(models.users, { foreignKey: 'owner_id', as: 'owner' });

    Conversations.hasMany(models.messages, {
      foreignKey: 'conversation_id',
      as: 'messages',
      onDelete: 'CASCADE'
    });
  };

  return Conversations;
}