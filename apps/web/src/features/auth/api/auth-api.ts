import type { AuthUser } from '../types';
import { apiRequest } from '../../../lib/api-client';

export const authApi = {
  me: () => apiRequest<AuthUser>('/api/auth/me'),
  login: (input: { email: string; password: string }) =>
    apiRequest<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: { name: string; email: string; password: string }) =>
    apiRequest<AuthUser>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => apiRequest<null>('/api/auth/logout', { method: 'POST' }),
};
