import { apiRequest } from '../../../lib/api-client';
import type { DirectoryUser } from '../types';

export const usersApi = {
  search: (email: string, signal?: AbortSignal) =>
    apiRequest<DirectoryUser[]>(`/api/users?email=${encodeURIComponent(email)}`, { signal }),
};
