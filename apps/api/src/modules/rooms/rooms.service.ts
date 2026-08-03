import { RoomsRepository } from './rooms.repository.js';
import type { RoomView } from './rooms.types.js';

function toRoomView(room: {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  createdAt: Date;
}): RoomView {
  return {
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    createdAt: room.createdAt.toISOString(),
  };
}

export class RoomsService {
  constructor(private readonly roomsRepository = new RoomsRepository()) {}

  async list(): Promise<RoomView[]> {
    const rooms = await this.roomsRepository.findAll();
    return rooms.map(toRoomView);
  }
}
