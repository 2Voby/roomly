import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AppShell } from '../components/AppShell';
import { Spinner } from '../components/ui/Spinner';
import { useCurrentUser } from '../features/auth/hooks/use-auth';
import { LoginPage } from '../pages/login/LoginPage';
import { MyBookingsPage } from '../pages/my-bookings/MyBookingsPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';
import { RegisterPage } from '../pages/register/RegisterPage';
import { RoomsPage } from '../pages/rooms/RoomsPage';
import { SchedulePage } from '../pages/schedule/SchedulePage';
import { VerifyEmailPage } from '../pages/verify-email/VerifyEmailPage';

function ProtectedRoute() {
  const location = useLocation();
  const { data: user, isPending, isError } = useCurrentUser();

  if (isPending) {
    return (
      <div className="page-center">
        <Spinner label="Перевіряємо сесію…" />
      </div>
    );
  }
  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <AppShell />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/schedule" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
