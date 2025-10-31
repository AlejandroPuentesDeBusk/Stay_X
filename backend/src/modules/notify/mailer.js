// backend/src/modules/notify/mailer.js
import nodemailer from 'nodemailer';
import logger from '../../core/logger.js';
import { AppError, ERR } from '../../core/errors.js';
import { env } from '../../config/env.js';

let transport = null;

async function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } = env;

  // --- INICIO DE LA MODIFICACIÓN ---
  // 1. Revisa si hay credenciales SMTP REALES.
  //    (Eliminamos 'NODE_ENV !== "development"' para que SIEMPRE las use si existen)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    logger.info('[MAIL] Usando configuración SMTP real.'); // <-- Log para confirmar
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT || 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  // --- FIN DE LA MODIFICACIÓN ---


  // 2. Si no hay SMTP real Y estamos en desarrollo, usa Ethereal
  //    (Este bloque es el que estaba antes)
  if (NODE_ENV === 'development') {
    try {
      const account = await nodemailer.createTestAccount();
      logger.info({ user: account.user }, '[MAIL] Usando cuenta de prueba Ethereal');
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false, auth: { user: account.user, pass: account.pass },
      });
    } catch(e) {
      logger.warn('[MAIL] Fallo al configurar Ethereal. Usando fallback a consola.');
    }
  }

  // 3. Fallback final: La consola
  logger.warn('[MAIL] No hay configuración SMTP. Usando fallback a la consola.');
  return {
    async sendMail(opts) {
      logger.info({ mail: opts }, 'Simulando envío de correo a la consola');
      return { messageId: 'console-fallback' };
    },
  };
}

export async function sendMail({ to, subject, html, from }) {
  if (!transport) {
    transport = await buildTransport();
  }

  try {
    const fromAddr = from || env.MAIL_FROM || 'StayX <no-reply@stayx.com>';
    
    // En un proyecto real, el logo se adjuntaría aquí
    const mailOptions = { to, from: fromAddr, subject, html };

    const info = await transport.sendMail(mailOptions);
    logger.info({ to, subject, messageId: info?.messageId }, '[MAIL] Correo enviado exitosamente.');

    // En desarrollo, muestra la URL de prueba de Ethereal
    if (env.NODE_ENV === 'development' && nodemailer.getTestMessageUrl(info)) {
        logger.info(`[MAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (err) {
    logger.error({ err, to, subject }, '[MAIL] Error al intentar enviar correo.');
    throw new AppError('Error en el servicio de correo.', 500, ERR.SERVICE_UNAVAILABLE, { cause: err.message });
  }
}