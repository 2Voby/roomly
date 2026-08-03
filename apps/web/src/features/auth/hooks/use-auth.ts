import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../api/auth-api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => queryClient.setQueryData(['auth', 'me'], user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => queryClient.setQueryData(['auth', 'me'], user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.removeQueries({ queryKey: ['auth', 'me'] }),
  });
}
