import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useCurrentUser, useLogout } from '../features/auth/hooks/use-auth';
import { Button } from './ui/Button';

export function AppShell() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
            <button className="notification-button" type="button" aria-label="Сповіщення">
              ♢
            </button>
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
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
