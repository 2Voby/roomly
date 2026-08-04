import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useCurrentUser, useLogout } from '../features/auth/hooks/use-auth';
import { Button } from './ui/Button';

export function AppShell() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle =
    location.pathname === '/my-bookings'
      ? 'Мої бронювання'
      : location.pathname === '/rooms'
        ? 'Переговорні'
        : 'Розклад переговорних';
  const pageSubtitle =
    location.pathname === '/my-bookings'
      ? 'Переглядайте майбутні та минулі зустрічі'
      : 'Плануйте зустрічі без зайвих повідомлень';

  async function handleLogout() {
    await logout.mutateAsync();
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-frame workspace-frame">
      <aside className="app-sidebar">
        <div className="sidebar-brand-wrap">
          <NavLink className="brand sidebar-brand" to="/schedule">
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            Roomly
          </NavLink>
          <span className="sidebar-subtitle">Бронювання переговорних</span>
        </div>
        <nav className="main-nav" aria-label="Основна навігація">
          <NavLink
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            to="/schedule"
          >
            <span className="nav-icon" aria-hidden="true">
              ▦
            </span>
            <span>Розклад</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            to="/my-bookings"
          >
            <span className="nav-icon" aria-hidden="true">
              ◷
            </span>
            <span>Мої бронювання</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            to="/rooms"
          >
            <span className="nav-icon" aria-hidden="true">
              ⌂
            </span>
            <span>Переговорні</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="user-avatar">{user?.name?.slice(0, 1).toUpperCase()}</span>
            <span className="sidebar-user-copy">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </span>
          </div>
          <Button
            className="sidebar-logout"
            variant="ghost"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <span aria-hidden="true">↪</span> Вийти
          </Button>
        </div>
      </aside>
      <section className="app-workspace">
        <header className="workspace-header">
          <div>
            <span className="workspace-eyebrow">Roomly workspace</span>
            <strong>{pageTitle}</strong>
            <small>{pageSubtitle}</small>
          </div>
          <div className="workspace-actions">
            <span className="office-status">
              <i /> Офіс відкритий
            </span>
            <button className="notification-button" type="button" aria-label="Сповіщення">
              ♢
            </button>
            <span className="user-avatar workspace-avatar">
              {user?.name?.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
