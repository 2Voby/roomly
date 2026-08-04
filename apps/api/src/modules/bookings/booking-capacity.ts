export function exceedsRoomCapacity(roomCapacity: number, participantCount: number): boolean {
  return participantCount + 1 > roomCapacity;
}
