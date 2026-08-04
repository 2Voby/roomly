import { exceedsRoomCapacity } from './booking-capacity.js';

describe('exceedsRoomCapacity', () => {
  it('allows the organizer and participants up to room capacity', () => {
    expect(exceedsRoomCapacity(4, 3)).toBe(false);
  });

  it('rejects one person over room capacity', () => {
    expect(exceedsRoomCapacity(4, 4)).toBe(true);
  });

  it('treats the organizer as one attendee', () => {
    expect(exceedsRoomCapacity(1, 0)).toBe(false);
    expect(exceedsRoomCapacity(1, 1)).toBe(true);
  });
});
