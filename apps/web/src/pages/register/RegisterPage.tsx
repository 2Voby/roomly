import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { useRegister } from '../../features/auth/hooks/use-auth';
import { ApiError } from '../../lib/api-client';
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
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  function onSubmit(values: RegisterFormValues) {
    const payload = { name: values.name, email: values.email, password: values.password };
    registerMutation.mutate(payload, {
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
    <AuthLayout
      title="Створення акаунта"
      subtitle="Створіть акаунт і бронюйте переговорні за кілька секунд."
    >
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Ім’я"
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
        <PasswordInput
          label="Пароль"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Підтвердження пароля"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <p className="password-hint">Від 8 до 72 символів</p>
        {registerMutation.error &&
        !(registerMutation.error instanceof ApiError && registerMutation.error.fields) ? (
          <p className="form-error">{registerMutation.error.message}</p>
        ) : null}
        <Button className="auth-submit" type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Створюємо…' : 'Зареєструватися'}
        </Button>
      </form>
      <p className="auth-switch">
        Уже маєте акаунт? <Link to="/login">Увійти</Link>
      </p>
    </AuthLayout>
  );
}
