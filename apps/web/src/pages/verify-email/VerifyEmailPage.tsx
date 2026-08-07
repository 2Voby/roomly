import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { useCurrentUser } from '../../features/auth/hooks/use-auth';
import { authApi } from '../../features/auth/api/auth-api';
import { ApiError } from '../../lib/api-client';
import { queryClient } from '../../lib/query-client';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { data: currentUser } = useCurrentUser();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Підтверджуємо email…');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('У посиланні немає токена підтвердження.');
      return;
    }

    let cancelled = false;
    void authApi
      .verifyEmail(token)
      .then((user) => {
        if (cancelled) return;
        queryClient.setQueryData(['auth', 'me'], user);
        setStatus('success');
        setMessage('Email підтверджено. Тепер можна бронювати переговорні.');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Не вдалося підтвердити email.');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthLayout title="Підтвердження email" subtitle="Перевіряємо посилання підтвердження.">
      <div className="verification-result">
        {status === 'pending' ? <Spinner label={message} /> : null}
        {status !== 'pending' ? (
          <>
            <div
              className={`verification-result-icon verification-result-${status}`}
              aria-hidden="true"
            >
              {status === 'success' ? '✓' : '!'}
            </div>
            <p>{message}</p>
            <Link className="button button-primary" to={currentUser ? '/schedule' : '/login'}>
              {currentUser ? 'До розкладу' : 'Увійти'}
            </Link>
          </>
        ) : null}
        {status === 'error' ? (
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Спробувати ще раз
          </Button>
        ) : null}
      </div>
    </AuthLayout>
  );
}
