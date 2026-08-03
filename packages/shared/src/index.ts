export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  BOOKING_IN_PAST: 'BOOKING_IN_PAST',
  OUTSIDE_WORKING_HOURS: 'OUTSIDE_WORKING_HOURS',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorPayload {
  code: ErrorCode | string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiSuccess<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface RoomDto {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  createdAt: string;
}

export interface BookingDto {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
  userId: string;
  userName: string;
  cancelledAt: string | null;
  createdAt: string;
}
