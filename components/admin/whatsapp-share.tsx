"use client";

import type { CandidateStatus, Position } from "@/domain/types";
import { POSITION_LABELS } from "@/domain/types";

interface Props {
  phone: string;
  candidateName: string;
  status: CandidateStatus;
  position: Position;
  restaurantName?: string;
}

function getWhatsAppMessage(
  candidateName: string,
  status: CandidateStatus,
  position: Position,
  restaurantName?: string
): string {
  const restaurant = restaurantName || "La Glorieta y Salomé";
  const cargo = POSITION_LABELS[position] || position;

  switch (status) {
    case "PRESELECCIONADO":
      return `Hola ${candidateName}, te informamos que has sido preseleccionado(a) para el cargo de ${cargo} en ${restaurant}. Nos pondremos en contacto para agendar tu entrevista personal. ¡Felicidades!`;
    case "CITADO_ENTREVISTA":
      return `Hola ${candidateName}, te invitamos a tu entrevista personal para el cargo de ${cargo} en ${restaurant}. Por favor confirma tu asistencia respondiendo a este mensaje.`;
    case "CONTRATADO":
      return `Hola ${candidateName}, ¡felicidades! Has sido seleccionado(a) para el cargo de ${cargo} en ${restaurant}. Pronto te enviaremos los detalles para tu proceso de incorporación.`;
    case "NO_CONTINUAR":
      return `Hola ${candidateName}, gracias por tu interés en el cargo de ${cargo} en ${restaurant}. En esta ocasión no continuaremos con el proceso, pero te invitamos a aplicar en el futuro. ¡Te deseamos éxito!`;
    case "BASE_DE_DATOS":
      return `Hola ${candidateName}, gracias por aplicar al cargo de ${cargo} en ${restaurant}. Hemos guardado tu perfil y si surge una oportunidad te contactaremos. ¡No necesitas volver a aplicar!`;
    case "EVALUADO_ENTREVISTA":
      return `Hola ${candidateName}, gracias por asistir a la entrevista para el cargo de ${cargo} en ${restaurant}. Un administrador se pondrá en contacto contigo pronto para discutir los próximos pasos.`;
    default:
      return `Hola ${candidateName}, te escribimos del equipo de contratación de ${restaurant} respecto a tu aplicación al cargo de ${cargo}.`;
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // If it starts with 57 (Colombia), use as-is. Otherwise, prepend 57.
  if (digits.startsWith("57")) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function WhatsAppShareButton({ phone, candidateName, status, position, restaurantName }: Props) {
  const message = getWhatsAppMessage(candidateName, status, position, restaurantName);
  const normalizedPhone = normalizePhone(phone);
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
      title="Enviar mensaje por WhatsApp"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      WhatsApp
    </a>
  );
}
