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
    <div className="app-frame">
      <header className="app-header">
        <div className="header-inner">
          <NavLink className="brand" to="/schedule">
            Roomly
          </NavLink>
          <nav className="main-nav" aria-label="Основна навігація">
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
          </nav>
          <div className="user-actions">
            <span className="user-name">{user?.name}</span>
            <Button variant="ghost" onClick={handleLogout} disabled={logout.isPending}>
              Вийти
            </Button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
