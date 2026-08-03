import type { UserDto } from '@roomly/shared';

export type AuthUser = UserDto;

export interface AuthCredentials {
  name?: string;
  email: string;
  password: string;
}
