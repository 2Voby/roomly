import { formatInTimeZone } from 'date-fns-tz';

import { env } from '../../config/env.js';
import type { BookingNotificationContext, NotificationDraft } from './notifications.types.js';

function formatBookingDate(context: BookingNotificationContext): string {
  return `${formatInTimeZone(context.startAt, env.OFFICE_TIMEZONE, 'dd.MM.yyyy')} о ${formatInTimeZone(
    context.startAt,
    env.OFFICE_TIMEZONE,
    'HH:mm',
  )}–${formatInTimeZone(context.endAt, env.OFFICE_TIMEZONE, 'HH:mm')}`;
}

export function createNotificationDraft(
  userId: string,
  type: NotificationDraft['type'],
  context: BookingNotificationContext,
): NotificationDraft {
  const date = formatBookingDate(context);

  switch (type) {
    case 'participant_added':
      return {
        userId,
        type,
        title: 'Вас додали до зустрічі',
        message: `Вас додали до «${context.title}» у кімнаті «${context.roomName}». ${date}.`,
      };
    case 'participant_removed':
      return {
        userId,
        type,
        title: 'Вас видалили із зустрічі',
        message: `Вас видалили із «${context.title}» у кімнаті «${context.roomName}». ${date}.`,
      };
    case 'booking_cancelled':
      return {
        userId,
        type,
        title: 'Зустріч скасовано',
        message: `Власник скасував «${context.title}» у кімнаті «${context.roomName}». ${date}.`,
      };
    case 'booking_ending':
      return {
        userId,
        type,
        title: 'Час зустрічі завершується',
        message: `Бронювання «${context.title}» у кімнаті «${context.roomName}» завершується через ${env.NOTIFY_BEFORE_MINUTES} хв.`,
      };
    case 'series_participant_added':
    case 'series_cancelled':
      return {
        userId,
        type,
        title: 'Зміна серії зустрічей',
        message: `Серію «${context.title}» у кімнаті «${context.roomName}» змінено.`,
      };
  }
}
