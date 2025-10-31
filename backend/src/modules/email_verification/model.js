// backend/src/modules/email-verifications/model.js
import { DataTypes, UUIDV4 } from 'sequelize';


export const MODEL_NAME = 'email_verifications';

// Usamos 1 hora (3600 segundos) como tiempo de expiración
const EXPIRATION_TIME = 3600; 

export function defineModel(sequelize) {
  const EmailVerification = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    // Token secreto que se usa en la URL de verificación
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    // Expiración: El token solo es válido por una hora
// --- INICIO DE LA MODIFICACIÓN ---
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      // Usamos una función en defaultValue para calcular la expiración
      defaultValue: () => {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + EXPIRATION_TIME);
        return expiresAt;
      }
    },
    // --- FIN DE LA MODIFICACIÓN ---
    // Para saber si el token ya se usó
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: MODEL_NAME,
    underscored: true,
    timestamps: true,
    paranoid: false, 

  });

  // Relación: Un token de verificación pertenece a un único usuario
  EmailVerification.associate = (models) => {
    EmailVerification.belongsTo(models.users, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });
  };
  
  // ELIMINA cualquier código que llame a EmailVerification.beforeCreate() aquí.

  return EmailVerification;
}