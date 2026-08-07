import { describe, expect, it } from 'vitest';

import { createEmailJob } from './email-templates.js';

const context = {
  roomId: 'room-id',
  roomName: '<Акваріум>',
  title: 'Планування & кварталу',
  organizerName: 'Олена Коваль',
  startAt: new Date('2026-08-10T08:00:00.000Z'),
  endAt: new Date('2026-08-10T09:00:00.000Z'),
};

describe('createEmailJob', () => {
  it('builds a participant email payload and escapes HTML content', () => {
    const job = createEmailJob(
      'participant-added',
      'event-id',
      { name: 'Іван', email: 'ivan@example.com' },
      context,
    );

    expect(job).toMatchObject({
      eventId: 'event-id',
      to: 'ivan@example.com',
      subject: 'Вас додали до зустрічі «Планування & кварталу»',
    });
    expect(job.html).toContain('&lt;Акваріум&gt;');
    expect(job.html).toContain('Планування &amp; кварталу');
  });
});
