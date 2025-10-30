// backend/src/modules/users/model.js
import { DataTypes, UUIDV4, Op } from 'sequelize'; 
import { ROLES } from '../../core/constants.js';

export const MODEL_NAME = 'users';

export function defineModel(sequelize) {
  const Users = sequelize.define(MODEL_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    // CRÍTICO: No hay tenant_id ya que es un marketplace single-tenant.
    
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true, // Único a nivel de aplicación (no por tenant)
      validate: { isEmail: true },
      set(value) {
        const v = typeof value === 'string' ? value.trim().toLowerCase() : value;
        this.setDataValue('email', v);
      },
    },
    password_hash: {
      type: DataTypes.TEXT,   // Para contraseñas locales
      allowNull: true,        // null para OAuth
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    
    // --- CAMPOS DE ROL Y VERIFICACIÓN ---

    // Rol: El usuario por defecto puede ser inquilino. Puede tener varios roles en el futuro (ej. ['arrendador', 'arrendatario'])
    role: {
      type: DataTypes.ENUM(ROLES.admin, ROLES.arrendador, ROLES.arrendatario, ROLES.system),
      allowNull: false,
      defaultValue: ROLES.arrendatario, // Por defecto es inquilino (arrendatario)
    },
    
    // Status de verificación de identidad (actualizado por el módulo 'verification')
    is_identity_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True si el KYC (CURP/INE) fue aprobado por el módulo verification',
    },

    // Identificador único de identidad (para evitar multicuentas)
    // CRÍTICO: Debe ser único globalmente. Lo obtendremos tras la verificación de INE/CURP
    identity_id: {
      type: DataTypes.STRING(30),
      allowNull: true, 
      unique: true, // Usamos CURP o RFC como identificador único global
    },
    
    // Configuración de 2FA
    two_factor_secret: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
        // Añadir al modelo users (además de los campos ya definidos):
    is_email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True si el usuario verificó su correo electrónico.',
    },

  }, {
    tableName: MODEL_NAME,
    underscored: true,
    timestamps: true,
    paranoid: true, // Habilita el borrado lógico
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['identity_id'], where: { identity_id: { [Op.ne]: null } } }, // Único si no es nulo
    ],
    // Sequelize asocia automáticamente los modelos en `sequelize.models`
    // No necesitamos associate aquí si no hay relaciones explícitas.
  });

  return Users;
}