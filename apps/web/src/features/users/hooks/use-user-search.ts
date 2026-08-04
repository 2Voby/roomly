import { useQuery } from '@tanstack/react-query';

import { usersApi } from '../api/users-api';

export function useUserSearch(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return useQuery({
    queryKey: ['users', 'search', normalizedEmail],
    queryFn: ({ signal }) => usersApi.search(normalizedEmail, signal),
    enabled: normalizedEmail.length >= 2,
    staleTime: 30_000,
  });
}
