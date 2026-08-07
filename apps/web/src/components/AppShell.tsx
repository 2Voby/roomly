import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useCurrentUser, useLogout } from '../features/auth/hooks/use-auth';
import { useNotifications } from '../features/notifications/hooks/use-notifications';
import { Button } from './ui/Button';

export function AppShell() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notifications = useNotifications(1);
  const unreadCount = notifications.data?.meta.unreadCount ?? 0;

  async function handleLogout() {
    await logout.mutateAsync();
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-frame workspace-frame">
      <header className="app-header workspace-top-header">
        <div className="header-inner">
          <NavLink className="brand topbar-brand" to="/schedule">
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            Roomly
          </NavLink>
          <nav className="main-nav topbar-nav" aria-label="Основна навігація">
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              to="/schedule"
            >
              Розклад
            </NavLink>
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              to="/my-bookings"
            >
              Мої бронювання
            </NavLink>
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              to="/rooms"
            >
              Переговорні
            </NavLink>
          </nav>
          <div className="topbar-actions">
            <span className="office-status">
              <i /> Офіс відкритий
            </span>
            <NavLink
              className="notification-button"
              to="/notifications"
              aria-label={`Сповіщення${unreadCount > 0 ? `, непрочитаних: ${unreadCount}` : ''}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
              {unreadCount > 0 ? (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              ) : null}
            </NavLink>
            <div className="header-user">
              <span className="user-avatar workspace-avatar">
                {user?.name?.slice(0, 1).toUpperCase()}
              </span>
              <span className="header-user-copy">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </span>
              <Button
                className="header-logout"
                variant="ghost"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                Вийти
              </Button>
            </div>
          </div>
        </div>
      </header>
      {user && !user.emailVerifiedAt ? (
        <div className="email-verification-banner" role="status">
          <strong>Підтвердіть email, щоб бронювати.</strong>
          <span>У dev-режимі посилання підтвердження є в логах API/worker.</span>
        </div>
      ) : null}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
