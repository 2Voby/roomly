import type { NotificationType } from '@roomly/shared';

export interface NotificationDraft {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface BookingNotificationContext {
  roomId: string;
  roomName: string;
  title: string;
  organizerName: string;
  startAt: Date;
  endAt: Date;
}
