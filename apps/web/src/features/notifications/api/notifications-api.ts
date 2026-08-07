import type { NotificationDto, NotificationsMetaDto } from '@roomly/shared';

import { apiRequest, apiRequestWithMeta } from '../../../lib/api-client';

export const notificationsApi = {
  list: (limit: number, signal?: AbortSignal) =>
    apiRequestWithMeta<NotificationDto[], NotificationsMetaDto>(
      `/api/notifications?limit=${limit}`,
      { signal },
    ),
  markRead: (ids: string[]) =>
    apiRequest<{ updated: number }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};
