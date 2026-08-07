import { formatInTimeZone } from 'date-fns-tz';

import { env } from '../../config/env.js';
import type { EmailJobData, EmailJobName } from './email-queue.js';
import type { NotificationDraft } from './notifications.types.js';

export interface SeriesNotificationContext {
  roomName: string;
  title: string;
  organizerName: string;
  firstStartAt: Date;
  lastStartAt: Date;
  occurrenceCount: number;
}

interface EmailRecipient {
  name: string;
  email: string;
}

function dateLabel(date: Date): string {
  return formatInTimeZone(date, env.OFFICE_TIMEZONE, 'dd.MM.yyyy о HH:mm');
}

function summary(context: SeriesNotificationContext): string {
  return `«${context.title}» у кімнаті «${context.roomName}», щотижня о ${formatInTimeZone(
    context.firstStartAt,
    env.OFFICE_TIMEZONE,
    'HH:mm',
  )}. ${context.occurrenceCount} зустрічей: ${dateLabel(context.firstStartAt)} — ${dateLabel(
    context.lastStartAt,
  )}.`;
}

export function createSeriesNotificationDraft(
  userId: string,
  type: 'series_participant_added' | 'series_cancelled',
  context: SeriesNotificationContext,
): NotificationDraft {
  const details = summary(context);
  return type === 'series_participant_added'
    ? {
        userId,
        type,
        title: 'Вас додали до серії зустрічей',
        message: `Вас додали до серії: ${details}`,
      }
    : {
        userId,
        type,
        title: 'Серію зустрічей скасовано',
        message: `Власник скасував серію: ${details}`,
      };
}

export function createSeriesEmailJob(
  type: Extract<EmailJobName, 'series-participant-added' | 'series-cancelled'>,
  eventId: string,
  recipient: EmailRecipient,
  context: SeriesNotificationContext,
): EmailJobData {
  const details = summary(context);
  const intro =
    type === 'series-participant-added'
      ? 'Вас додали до серії повторюваних зустрічей.'
      : 'Власник скасував серію повторюваних зустрічей.';
  const subject =
    type === 'series-participant-added'
      ? `Вас додали до серії зустрічей «${context.title}»`
      : `Серію зустрічей «${context.title}» скасовано`;

  return {
    eventId,
    to: recipient.email,
    recipientName: recipient.name,
    subject,
    text: `Вітаємо, ${recipient.name}!\n\n${intro}\n\n${details}\nОрганізатор: ${context.organizerName}`,
    html: `<p>Вітаємо, ${escapeHtml(recipient.name)}!</p><p>${escapeHtml(intro)}</p><p>${escapeHtml(
      details,
    )}</p><p>Організатор: ${escapeHtml(context.organizerName)}</p>`,
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
