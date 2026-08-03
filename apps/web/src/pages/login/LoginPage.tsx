import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { useLogin } from '../../features/auth/hooks/use-auth';
import { loginFormSchema, type LoginFormValues } from '../../features/auth/schemas/auth-schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(values, {
      onSuccess: () =>
        navigate((location.state as { from?: string } | null)?.from ?? '/schedule', {
          replace: true,
        }),
      onError: (error) => {
        if (error instanceof ApiError && error.fields) {
          for (const [field, message] of Object.entries(error.fields))
            setError(field as keyof LoginFormValues, { type: 'server', message });
        }
      },
    });
  }

  return (
    <AuthLayout title="Вітаємо знову" subtitle="Увійдіть, щоб забронювати переговорну кімнату.">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {login.error && !(login.error instanceof ApiError && login.error.fields) ? (
          <p className="form-error">{login.error.message}</p>
        ) : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Входимо…' : 'Увійти'}
        </Button>
      </form>
      <p className="auth-switch">
        Немає акаунта? <Link to="/register">Зареєструватися</Link>
      </p>
    </AuthLayout>
  );
}
