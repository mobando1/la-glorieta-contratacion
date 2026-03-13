import { logger } from "@/lib/logger";
import { prisma } from "@/server/db/prisma";

let resendInstance: any = null;

async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    const { Resend } = await import("resend");
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM = () => process.env.EMAIL_FROM || "onboarding@resend.dev";

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

export async function sendHiredEmail(
  to: string,
  candidateName: string,
  position: string,
  restaurantName?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `¡Felicidades ${candidateName}! Has sido seleccionado(a) — ${restaurant}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #14b8a6;">¡Felicidades, ${candidateName}! 🎉</h2>
      <p>Nos complace informarte que has sido <strong>seleccionado(a)</strong> para el cargo de <strong>${position}</strong> en <strong>${restaurant}</strong>.</p>
      <p>Gracias por tu tiempo y dedicación durante el proceso de selección. Estamos muy contentos de que te unas a nuestro equipo.</p>
      <!-- VIDEO_BIENVENIDA: Agregar embed de YouTube con video de bienvenida cuando esté disponible -->
      <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-weight: 600; color: #134e4a;">Próximos pasos:</p>
        <p style="margin: 8px 0 0; color: #115e59;">Pronto te contactaremos por WhatsApp o correo con los detalles para tu proceso de incorporación. Mantente atento(a).</p>
      </div>
      <p>¡Bienvenido(a) al equipo!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Equipo de Contratación — ${restaurant}</p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendOnboardingLinkEmail(
  to: string,
  candidateName: string,
  onboardingUrl: string,
  restaurantName?: string
): Promise<boolean> {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const subject = `Tu enlace de incorporación — ${restaurant}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #14b8a6;">Hola ${candidateName},</h2>
      <p>Ya puedes completar tu proceso de incorporación a <strong>${restaurant}</strong>.</p>
      <p>Haz clic en el siguiente botón para comenzar:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${onboardingUrl}" style="display: inline-block; background-color: #14b8a6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Completar incorporación
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Este enlace es válido por 7 días. Si tienes problemas, copia y pega esta URL en tu navegador:</p>
      <p style="color: #6b7280; font-size: 13px; word-break: break-all;">${onboardingUrl}</p>
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

export async function sendNewCandidateNotificationToAdmins(
  candidateName: string,
  position: string,
  restaurantName: string,
  candidateId: string
): Promise<void> {
  try {
    const admins = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    if (admins.length === 0) return;

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const candidateUrl = `${baseUrl}/admin/candidatos/${candidateId}`;

    const subject = `Nuevo candidato: ${candidateName} — ${restaurantName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nuevo candidato registrado</h2>
        <p><strong>Nombre:</strong> ${candidateName}</p>
        <p><strong>Puesto:</strong> ${position}</p>
        <p><strong>Restaurante:</strong> ${restaurantName}</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${candidateUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
            Ver candidato
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 14px;">Sistema de Contratación — La Glorieta y Salomé</p>
      </div>
    `;

    await Promise.allSettled(
      admins.map((admin) => sendEmail(admin.email, subject, html))
    );
  } catch (error) {
    logger.error("Failed to notify admins of new candidate", { error: String(error) });
  }
}
