import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { useRegister } from '../../features/auth/hooks/use-auth';
import {
  registerFormSchema,
  type RegisterFormValues,
} from '../../features/auth/schemas/auth-schemas';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values, {
      onSuccess: () => navigate('/schedule', { replace: true }),
      onError: (error) => {
        if (error instanceof ApiError && error.fields) {
          for (const [field, message] of Object.entries(error.fields))
            setError(field as keyof RegisterFormValues, { type: 'server', message });
        }
      },
    });
  }

  return (
    <AuthLayout title="Створіть акаунт" subtitle="Бронюйте кімнати без зайвих листувань і таблиць.">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Імʼя"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {registerMutation.error &&
        !(registerMutation.error instanceof ApiError && registerMutation.error.fields) ? (
          <p className="form-error">{registerMutation.error.message}</p>
        ) : null}
        <Button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Створюємо…' : 'Створити акаунт'}
        </Button>
      </form>
      <p className="auth-switch">
        Вже маєте акаунт? <Link to="/login">Увійти</Link>
      </p>
    </AuthLayout>
  );
}
