// backend/src/modules/notify/templates.js

function baseLayout(title, contentHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
        h1 { color: #1e3a8a; font-size: 24px; }
        p { color: #333; line-height: 1.6; }
        .button { display: inline-block; background: #185DC1; color: #ffffff !important; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>StayX</h1>
        ${contentHtml}
      </div>
    </body>
    </html>
  `;
}

/**
 * Plantilla de verificación de correo para el registro.
 */
export function sendVerificationEmailTemplate(name, verificationLink) {
    const content = `
        <h1>¡Bienvenido a StayX!</h1>
        <p>Hola ${name},</p>
        <p>Gracias por registrarte. Por favor, haz clic en el siguiente botón para verificar tu correo electrónico y activar tu cuenta.</p>
        <a href="${verificationLink}" class="button">Verificar Mi Correo</a>
        <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>El equipo de StayX.</p>
    `;
    return baseLayout('Verificación de Correo Electrónico', content);
}