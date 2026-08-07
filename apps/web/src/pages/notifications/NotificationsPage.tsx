import { useEffect } from 'react';

import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Spinner } from '../../components/ui/Spinner';
import {
  useMarkNotificationsRead,
  useNotifications,
} from '../../features/notifications/hooks/use-notifications';
import { formatUserDateTime } from '../../lib/timezone';

export function NotificationsPage() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unreadIds =
    notifications.data?.data
      .filter((notification) => !notification.readAt)
      .map((notification) => notification.id) ?? [];
  const unreadKey = unreadIds.join(',');

  useEffect(() => {
    if (unreadIds.length > 0) markRead.mutate(unreadIds);
  }, [markRead.mutate, unreadKey]);

  return (
    <div className="content-wrap notifications-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">Центр подій</span>
          <h1>Сповіщення</h1>
          <p>Тут зберігаються важливі зміни ваших зустрічей.</p>
        </div>
      </div>

      {notifications.isPending ? <Spinner label="Завантажуємо сповіщення…" /> : null}
      {notifications.isError ? <ErrorState onRetry={() => void notifications.refetch()} /> : null}
      {notifications.data?.data.length === 0 ? (
        <EmptyState
          title="Поки немає сповіщень"
          description="Нові події зустрічей зʼявляться тут."
        />
      ) : null}
      {notifications.data?.data.length ? (
        <div className="notifications-list" aria-live="polite">
          {notifications.data.data.map((notification) => (
            <article
              className={`notification-card ${notification.readAt ? '' : 'notification-card-unread'}`}
              key={notification.id}
            >
              <span className="notification-card-icon" aria-hidden="true">
                {notification.type === 'booking_ending' ? '◷' : '•'}
              </span>
              <div className="notification-card-copy">
                <div className="notification-card-heading">
                  <h2>{notification.title}</h2>
                  <time dateTime={notification.createdAt}>
                    {formatUserDateTime(new Date(notification.createdAt))}
                  </time>
                </div>
                <p>{notification.message}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
