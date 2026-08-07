import bcrypt from 'bcrypt';
import { addDays, format, startOfWeek } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { env } from '../config/env.js';
import { prisma } from './prisma.js';

const rooms = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Акваріум',
    floor: 1,
    capacity: 8,
    workStartMinutes: 540,
    workEndMinutes: 1140,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Марс',
    floor: 1,
    capacity: 6,
    workStartMinutes: 540,
    workEndMinutes: 1140,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Гагарін',
    floor: 2,
    capacity: 10,
    workStartMinutes: 540,
    workEndMinutes: 1140,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'Орбіта',
    floor: 2,
    capacity: 12,
    workStartMinutes: 540,
    workEndMinutes: 1140,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'Атлас',
    floor: 3,
    capacity: 4,
    workStartMinutes: 540,
    workEndMinutes: 1140,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    name: 'Комета',
    floor: 3,
    capacity: 6,
    workStartMinutes: 540,
    workEndMinutes: 1140,
  },
];

const users = [
  { id: '20000000-0000-4000-8000-000000000001', name: 'Олена Коваль', email: 'olena@example.com' },
  { id: '20000000-0000-4000-8000-000000000002', name: 'Іван Петренко', email: 'ivan@example.com' },
  {
    id: '20000000-0000-4000-8000-000000000003',
    name: 'Владислав Герасимчук',
    email: 'vladyslav@example.com',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    name: 'Марія Бондар',
    email: 'maria@example.com',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    name: 'Андрій Шевченко',
    email: 'andrii@example.com',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    name: 'Софія Мельник',
    email: 'sofia@example.com',
  },
];

function atOfficeTime(date: Date, hours: number, minutes: number): Date {
  return fromZonedTime(
    `${format(date, 'yyyy-MM-dd')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
    env.OFFICE_TIMEZONE,
  );
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('roomly123', 12);
  const createdUsers = [];

  for (const user of users) {
    createdUsers.push(
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, passwordHash, emailVerifiedAt: new Date() },
        create: { ...user, passwordHash, emailVerifiedAt: new Date() },
      }),
    );
  }

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: { floor: room.floor, capacity: room.capacity },
      create: room,
    });
  }

  const localNow = toZonedTime(new Date(), env.OFFICE_TIMEZONE);
  const weekStart = startOfWeek(localNow, { weekStartsOn: 1 });
  const aquarium = rooms[0];
  const mars = rooms[1];
  const gagarin = rooms[2];
  const olena = createdUsers[0];
  const ivan = createdUsers[1];

  if (!aquarium || !mars || !gagarin || !olena || !ivan)
    throw new Error('Seed fixtures are incomplete');

  const bookings = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      title: 'Планування спринту',
      day: 1,
      start: [10, 0],
      end: [11, 0],
      roomId: aquarium.id,
      userId: ivan.id,
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      title: 'Фокус-робота',
      day: 2,
      start: [9, 30],
      end: [10, 30],
      roomId: aquarium.id,
      userId: olena.id,
    },
    {
      id: '30000000-0000-4000-8000-000000000003',
      title: 'Щотижнева синхронізація',
      day: 3,
      start: [13, 0],
      end: [14, 0],
      roomId: mars.id,
      userId: ivan.id,
    },
    {
      id: '30000000-0000-4000-8000-000000000004',
      title: 'Демо для клієнта',
      day: 4,
      start: [15, 0],
      end: [16, 30],
      roomId: gagarin.id,
      userId: olena.id,
    },
    {
      id: '30000000-0000-4000-8000-000000000005',
      title: 'Підсумки тижня',
      day: 8,
      start: [11, 0],
      end: [12, 0],
      roomId: aquarium.id,
      userId: ivan.id,
    },
    {
      id: '30000000-0000-4000-8000-000000000006',
      title: 'Ретроспектива',
      day: 9,
      start: [16, 30],
      end: [17, 30],
      roomId: mars.id,
      userId: olena.id,
    },
  ] as const;

  for (const booking of bookings) {
    const date = addDays(weekStart, booking.day);
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        title: booking.title,
        startAt: atOfficeTime(date, booking.start[0], booking.start[1]),
        endAt: atOfficeTime(date, booking.end[0], booking.end[1]),
        roomId: booking.roomId,
        userId: booking.userId,
        cancelledAt: null,
      },
      create: {
        id: booking.id,
        title: booking.title,
        startAt: atOfficeTime(date, booking.start[0], booking.start[1]),
        endAt: atOfficeTime(date, booking.end[0], booking.end[1]),
        roomId: booking.roomId,
        userId: booking.userId,
      },
    });
  }

  const bookingParticipants = [
    {
      bookingId: bookings[0]?.id,
      userId: olena.id,
    },
    {
      bookingId: bookings[3]?.id,
      userId: ivan.id,
    },
  ];

  for (const participant of bookingParticipants) {
    if (!participant.bookingId) continue;
    await prisma.bookingParticipant.upsert({
      where: {
        bookingId_userId: {
          bookingId: participant.bookingId,
          userId: participant.userId,
        },
      },
      update: {},
      create: participant,
    });
  }

  process.stdout.write(
    `Seeded ${rooms.length} rooms, ${users.length} users and ${bookings.length} bookings\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
