// src/modules/messages/model.js
import { DataTypes, UUIDV4 } from 'sequelize';

export const MODEL_NAME = 'messages';

export function defineModel(sequelize) {
  const Messages = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    // --- CORRECCIÓN DE ERROR (Llaves foráneas explícitas) ---
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'conversations', key: 'id' },
      onDelete: 'CASCADE',
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL', // Mantener el mensaje si el usuario se borra
    },
    // --- FIN DE LA CORRECCIÓN ---
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'messages',
    underscored: true,
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['conversation_id', 'created_at'] },
      { fields: ['sender_id'] },
    ]
  });

  Messages.associate = (models) => {
    Messages.belongsTo(models.conversations, { foreignKey: 'conversation_id', as: 'conversation' });
    Messages.belongsTo(models.users, { foreignKey: 'sender_id', as: 'sender' });
  };

  return Messages;
}
