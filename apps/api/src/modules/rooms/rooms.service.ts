import { RoomsRepository } from './rooms.repository.js';
import { getRoomAvailability } from './room-availability.js';
import type { RoomView } from './rooms.types.js';
import type { RoomAvailabilityView } from './rooms.types.js';
import { env } from '../../config/env.js';

function toRoomView(room: {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  workStartMinutes: number;
  workEndMinutes: number;
  createdAt: Date;
}): RoomView {
  return {
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    workStartMinutes: room.workStartMinutes,
    workEndMinutes: room.workEndMinutes,
    createdAt: room.createdAt.toISOString(),
  };
}

export class RoomsService {
  constructor(private readonly roomsRepository = new RoomsRepository()) {}

  async list(): Promise<RoomView[]> {
    const rooms = await this.roomsRepository.findAll();
    return rooms.map(toRoomView);
  }

  async availability(at: Date): Promise<RoomAvailabilityView[]> {
    const rooms = await this.roomsRepository.findForAvailability(at);
    return rooms.map((room) => getRoomAvailability(room, room.bookings, at, env.OFFICE_TIMEZONE));
  }
}
