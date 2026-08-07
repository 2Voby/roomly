import type { BookingNotificationContext } from './notifications.types.js';
import type { EmailJobData, EmailJobName } from './email-queue.js';
import { env } from '../../config/env.js';

interface EmailRecipient {
  name: string;
  email: string;
}

export function createConfirmationEmailJob(
  eventId: string,
  recipient: EmailRecipient,
  verificationUrl: string,
): EmailJobData {
  return {
    eventId,
    to: recipient.email,
    recipientName: recipient.name,
    subject: 'Підтвердіть email у Roomly',
    text: `Вітаємо, ${recipient.name}!\n\nПідтвердіть email, щоб бронювати переговорні:\n${verificationUrl}`,
    html: `<p>Вітаємо, ${escapeHtml(recipient.name)}!</p><p>Підтвердіть email, щоб бронювати переговорні:</p><p><a href="${escapeHtml(verificationUrl)}">Підтвердити email</a></p>`,
    confirmationUrl: verificationUrl,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bookingDate(context: BookingNotificationContext): string {
  const date = new Intl.DateTimeFormat('uk-UA', {
    timeZone: env.OFFICE_TIMEZONE,
    dateStyle: 'short',
  }).format(context.startAt);
  const start = new Intl.DateTimeFormat('uk-UA', {
    timeZone: env.OFFICE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(context.startAt);
  const end = new Intl.DateTimeFormat('uk-UA', {
    timeZone: env.OFFICE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(context.endAt);
  return `${date} · ${start}–${end} (${env.OFFICE_TIMEZONE})`;
}

export function createEmailJob(
  type: EmailJobName,
  eventId: string,
  recipient: EmailRecipient,
  context: BookingNotificationContext,
): EmailJobData {
  const bookingTitle = `«${context.title}»`;
  const date = bookingDate(context);
  const details = `Зустріч: ${bookingTitle}\nКімната: ${context.roomName}\nЧас: ${date}\nОрганізатор: ${context.organizerName}`;
  const htmlDetails = `<p><strong>Зустріч:</strong> ${escapeHtml(bookingTitle)}</p><p><strong>Кімната:</strong> ${escapeHtml(context.roomName)}</p><p><strong>Час:</strong> ${escapeHtml(date)}</p><p><strong>Організатор:</strong> ${escapeHtml(context.organizerName)}</p>`;

  const copy = {
    'participant-added': {
      subject: `Вас додали до зустрічі ${bookingTitle}`,
      intro: `Вас додали до зустрічі ${bookingTitle}.`,
    },
    'participant-removed': {
      subject: `Вас видалили із зустрічі ${bookingTitle}`,
      intro: `Вас видалили із зустрічі ${bookingTitle}.`,
    },
    'booking-cancelled': {
      subject: `Зустріч ${bookingTitle} скасована`,
      intro: `Власник скасував зустріч ${bookingTitle}.`,
    },
    'email-confirmation': {
      subject: 'Підтвердіть email у Roomly',
      intro: 'Підтвердіть email, щоб бронювати переговорні.',
    },
    'series-participant-added': {
      subject: `Серію зустрічей ${bookingTitle} створено`,
      intro: `Вас додали до серії повторюваних зустрічей ${bookingTitle}.`,
    },
    'series-cancelled': {
      subject: `Серію зустрічей ${bookingTitle} скасовано`,
      intro: `Власник скасував серію повторюваних зустрічей ${bookingTitle}.`,
    },
  }[type];

  return {
    eventId,
    to: recipient.email,
    recipientName: recipient.name,
    subject: copy.subject,
    text: `Вітаємо, ${recipient.name}!\n\n${copy.intro}\n\n${details}`,
    html: `<p>Вітаємо, ${escapeHtml(recipient.name)}!</p><p>${escapeHtml(copy.intro)}</p>${htmlDetails}`,
  };
}
