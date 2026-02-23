import { logger } from "@/lib/logger";

let resendInstance: any = null;

async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    const { Resend } = await import("resend");
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM = () => process.env.EMAIL_FROM || "contratacion@laglorieta.com";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const resend = await getResend();
    if (!resend) {
      logger.warn("RESEND_API_KEY not configured, skipping email", { to, subject });
      return false;
    }

    await resend.emails.send({
      from: FROM(),
      to,
      subject,
      html,
    });

    logger.info("Email sent", { to, subject });
    return true;
  } catch (error) {
    logger.error("Email send failed", { to, subject, error: String(error) });
    return false;
  }
}

export async function sendApplicationReceivedEmail(
  to: string,
  candidateName: string
): Promise<boolean> {
  const subject = "Recibimos tu aplicación — La Glorieta y Salomé";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Hola ${candidateName},</h2>
      <p>Gracias por aplicar a nuestro proceso de selección.</p>
      <p>Estamos revisando tu información. Pronto te contactaremos para informarte si pasas a la entrevista personal.</p>
      <p>Mantente atento(a) a tu teléfono y correo electrónico.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — La Glorieta y Salomé</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendRejectionEmail(
  to: string,
  candidateName: string,
  restaurantName?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `Sobre tu aplicación — ${restaurant}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4b5563;">Hola ${candidateName},</h2>
      <p>Gracias por tu interés en trabajar con nosotros.</p>
      <p>En esta ocasión no continuaremos con tu proceso, pero te invitamos a aplicar nuevamente en el futuro.</p>
      <p>¡Te deseamos mucho éxito!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — ${restaurant}</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendDatabaseSavedEmail(
  to: string,
  candidateName: string,
  restaurantName?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `Tu perfil ha sido guardado — ${restaurant}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Hola ${candidateName},</h2>
      <p>Hemos guardado tu información en nuestra base de datos de talento.</p>
      <p>Si surge una oportunidad que se ajuste a tu perfil, nos pondremos en contacto contigo.</p>
      <p>No necesitas volver a aplicar.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — ${restaurant}</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendPostInterviewPassedEmail(
  to: string,
  candidateName: string,
  restaurantName?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `Sobre tu entrevista personal — ${restaurant}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Hola ${candidateName},</h2>
      <p>Gracias por asistir a la entrevista personal.</p>
      <p>Estamos evaluando tu perfil. Un administrador se pondrá en contacto contigo en breve para discutir los próximos pasos.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — ${restaurant}</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendPreselectionEmail(
  to: string,
  candidateName: string,
  restaurantName?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `¡Felicidades ${candidateName}! Has sido preseleccionado(a)`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">¡Buenas noticias, ${candidateName}!</h2>
      <p>Te informamos que has sido <strong>preseleccionado(a)</strong> para el proceso de contratación en <strong>${restaurant}</strong>.</p>
      <p>Has pasado la primera fase de evaluación y pronto nos pondremos en contacto contigo para agendar tu entrevista personal.</p>
      <p>Por favor mantente atento(a) a tu teléfono y correo electrónico.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — ${restaurant}</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendInterviewInvitation(
  to: string,
  candidateName: string,
  restaurantName?: string,
  date?: string,
  location?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `Citación a entrevista personal — ${restaurant}`;

  const dateInfo = date
    ? `<p><strong>Fecha:</strong> ${new Date(date).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>`
    : `<p>Próximamente te confirmaremos la fecha y hora exacta.</p>`;

  const locationInfo = location
    ? `<p><strong>Lugar:</strong> ${location}</p>`
    : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Hola ${candidateName},</h2>
      <p>Te invitamos a una <strong>entrevista personal</strong> para el cargo al que aplicaste en <strong>${restaurant}</strong>.</p>
      ${dateInfo}
      ${locationInfo}
      <p>Te recomendamos llegar con anticipación y traer tu documento de identidad.</p>
      <p>Si tienes alguna duda o no puedes asistir, comunícate con nosotros lo antes posible.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — ${restaurant}</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}
