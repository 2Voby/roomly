export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
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
  workStartMinutes: number;
  workEndMinutes: number;
  createdAt: string;
}

export type RoomAvailabilityStatus = 'available' | 'occupied' | 'closed';

export interface RoomAvailabilityDto extends RoomDto {
  status: RoomAvailabilityStatus;
  occupiedUntil: string | null;
  nextAvailableAt: string | null;
}

export interface BookingDto {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
  roomName: string;
  roomFloor: number;
  roomCapacity: number;
  userId: string;
  userName: string;
  participants: BookingParticipantDto[];
  cancelledAt: string | null;
  createdAt: string;
}

export interface BookingParticipantDto {
  id: string;
  name: string;
  email: string;
}

export interface MyBookingsSummaryDto {
  upcomingThisWeek: number;
  upcomingDurationMinutes: number;
}

export interface MyBookingsMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: MyBookingsSummaryDto;
}
