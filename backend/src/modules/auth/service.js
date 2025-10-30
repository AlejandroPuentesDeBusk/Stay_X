// src/modules/auth/service.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Op } from 'sequelize'; // <--- Necesitas Op para las consultas!
import { getModel } from '../../core/db/registry.js';
import { AppError, ERR } from '../../core/errors.js';
import { generateTokens, verifyToken } from '../../auth/jwt.service.js';
// FIX 3.2: La ruta relativa para los módulos hermanos es correcta: '../notify/...'
import * as mailer from '../notify/mailer.js'; 
import { sendVerificationEmailTemplate } from '../notify/templates.js'; 
import { env } from '../../config/env.js'; // <--- FIX 1: Import nombrado
import { ROLES } from '../../core/constants.js'; // <--- Necesitas ROLES
// ... (resto del código) ...

const Users = getModel('users');
const EmailVerification = getModel('email_verifications');
const SALT_ROUNDS = 12;

/**
 * 1. REGISTRO ESTÁNDAR
 * Crea un usuario, encripta la contraseña y envía un email de verificación.
 */
export async function registerService(payload) {
  // 1. Verificar unicidad (la DB lo hace, pero es mejor dar un mensaje limpio)
  const existingUser = await Users.findOne({ where: { email: payload.email.toLowerCase() } });
  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este correo.', 409, ERR.CONFLICT);
  }

  // 2. Encriptar contraseña
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const password_hash = await bcrypt.hash(payload.password, salt);

  // 3. Crear usuario (is_email_verified = false por defecto)
  const user = await Users.create({
    ...payload,
    password_hash,
    // Aseguramos que el email no esté verificado hasta que haga clic en el enlace
    is_email_verified: false, 
  });
  
  // 4. Generar y enviar token de verificación
  await sendVerificationToken(user);

  // Excluir la contraseña y el hash en la respuesta
  const userPublic = user.get({ plain: true });
  delete userPublic.password_hash;

  return userPublic;
}

/**
 * Crea el token de verificación y lo envía.
 */
async function sendVerificationToken(user) {
  // 1. Generar token aleatorio
  const token = crypto.randomBytes(32).toString('hex');

  // 2. Almacenar el token en la DB
  await EmailVerification.create({
    user_id: user.id,
    token: token,
  });

  // 3. Crear el link de verificación (usando una variable de entorno para el FRONTEND)
  const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  // 4. Enviar el correo
  await mailer.sendMail({
    to: user.email,
    subject: 'Verifica tu Correo Electrónico para StayX',
    html: sendVerificationEmailTemplate(user.name, verificationLink),
  });
}


/**
 * 2. LOGIN ESTÁNDAR
 * Verifica credenciales y genera tokens.
 */
export async function loginService(email, password) {
  // 1. Buscar usuario
  const user = await Users.findOne({ 
    where: { email: email.toLowerCase() } 
  });
  if (!user || !user.password_hash) {
    throw new AppError('Credenciales inválidas.', 401, ERR.UNAUTHORIZED);
  }

  // 2. Comparar contraseña
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Credenciales inválidas.', 401, ERR.UNAUTHORIZED);
  }

  // 3. Si las credenciales son válidas, generar tokens
  const userPublic = user.get({ plain: true });
  delete userPublic.password_hash;
  
  return generateTokens(userPublic);
}

/**
 * 3. VERIFICACIÓN DE EMAIL
 * Confirma el token y actualiza el campo is_email_verified.
 */
export async function verifyEmailService(token) {
  // 1. Buscar el token y verificar expiración/uso
  const verificationRecord = await EmailVerification.findOne({
    where: { 
      token: token, 
      used_at: { [Op.is]: null }, // Que no haya sido usado
      expires_at: { [Op.gt]: new Date() } // Que no haya expirado
    },
    include: [{ model: Users, as: 'user' }]
  });

  if (!verificationRecord) {
    throw new AppError('Token de verificación inválido o expirado.', 400, ERR.INVALID_TOKEN);
  }

  // 2. Marcar el token como usado y actualizar el usuario
  await EmailVerification.update(
    { used_at: new Date() },
    { where: { id: verificationRecord.id } }
  );

  const user = verificationRecord.user;

  // 3. Actualizar el status de verificación de email del usuario
  if (!user.is_email_verified) {
    await user.update({ is_email_verified: true });
  }

  return user.email;
}

/**
 * 4. REFRESH TOKEN
 * Genera un nuevo Access Token a partir de un Refresh Token válido.
 */
export async function refreshAccessTokenService(refreshToken) {
  // 1. Verificar el refresh token
  const payload = verifyToken(refreshToken, true);
  if (!payload) {
    throw new AppError('Refresh token inválido o expirado. Vuelva a iniciar sesión.', 401, ERR.UNAUTHORIZED);
  }

  // 2. Buscar usuario
  const user = await Users.findByPk(payload.id);
  if (!user) {
    throw new AppError('Usuario no encontrado.', 404, ERR.NOT_FOUND);
  }

  // 3. Generar nuevo Access Token (el Refresh Token se mantiene)
  const userPublic = user.get({ plain: true });
  delete userPublic.password_hash;
  
  const { accessToken } = generateTokens(userPublic);
  
  return { accessToken };
}

/**
 * 5. LOGIN SOCIAL (Google/OAuth)
 * Busca usuario por email. Si no existe, lo crea automáticamente.
 * NOTA: Esta función DEBE ser llamada DESPUÉS de validar el token de Google.
 * @param {string} email - Email validado por el proveedor social.
 * @param {string} name - Nombre del usuario.
 */
export async function socialLoginService(email, name) {
  let user = await Users.findOne({ 
    where: { email: email.toLowerCase() } 
  });
  
  let newUser = false;

  if (!user) {
    // Si no existe, lo crea.
    user = await Users.create({
      email,
      name,
      password_hash: null, // No hay contraseña local
      is_email_verified: true, // Asumimos verificación del proveedor social
      // identity_id: null, // Se verificará después
    });
    newUser = true;
  }
  
  // Generar tokens y devolver el usuario
  const userPublic = user.get({ plain: true });
  delete userPublic.password_hash;
  
  const tokens = generateTokens(userPublic);
  
  return { user: userPublic, tokens, newUser };
}