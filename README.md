# Roomly

Roomly — базовий full-stack застосунок для бронювання переговорних кімнат. Проєкт побудований як npm-workspaces monorepo з модульним Express API, React/Vite web-клієнтом та PostgreSQL.

## Стек

- Backend: Node.js 22, Express 5, TypeScript strict, Prisma 6, PostgreSQL 16, Zod, bcrypt, express-session + connect-pg-simple.
- Frontend: React 19, Vite 7, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, date-fns/date-fns-tz.
- Quality: ESLint 9, Prettier, Vitest, Supertest.
- Runtime: Docker Compose, nginx.

## Швидкий старт через Docker

Потрібні Docker Engine та Docker Compose.

```bash
docker compose up --build
```

Після старту:

- web: http://localhost:3000
- API: http://localhost:3000/api
- health: http://localhost:3000/api/health

Compose чекає на PostgreSQL healthcheck, застосовує Prisma migrations і запускає idempotent seed перед стартом API. Дані PostgreSQL зберігаються у volume `roomly-postgres`.

## Локальний запуск

1. Скопіюйте `.env.example` у `.env` і змініть `SESSION_SECRET` на випадковий рядок довжиною щонайменше 32 символи.
2. Запустіть PostgreSQL локально або використайте тільки його з Compose.
3. Встановіть залежності та згенеруйте Prisma client:

```bash
npm install
npx prisma generate --schema apps/api/prisma/schema.prisma
npm run db:migrate
npm run db:seed
npm run dev
```

Локальний web доступний на http://localhost:5173, API — на http://localhost:4000. У dev `.env` використовується `VITE_API_URL=http://localhost:4000`.

## Root scripts

```text
npm run dev          # API + Vite concurrently
npm run build        # shared, API, web
npm run typecheck    # усі workspace
npm run test         # усі workspace
npm run lint         # усі workspace
npm run format       # Prettier
npm run db:migrate   # prisma migrate deploy
npm run db:seed      # idempotent seed
npm run docker:up
npm run docker:down
```

## Архітектура backend

`apps/api/src` — модульний моноліт. Кожен feature-модуль розділений на routes, controller, service, repository, schemas і types:

```text
config/              env і session
database/            Prisma client і seed
shared/              errors, middleware, response, UTC/timezone utilities
modules/auth/        register, login, logout, me
modules/users/       user repository/service
modules/rooms/       кімнати та room schedule
modules/bookings/    створення, конфлікти, скасування, my bookings
modules/health/      GET /api/health
```

Controller працює тільки з HTTP, service містить бізнес-правила, repository — Prisma queries. HTTP-помилки проходять через централізований error handler.

Відповіді мають формат `{ data, meta }`, а помилки — `{ error: { code, message, fields } }`. Реалізовані коди: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `EMAIL_ALREADY_EXISTS`, `ROOM_NOT_FOUND`, `BOOKING_NOT_FOUND`, `BOOKING_CONFLICT`, `BOOKING_IN_PAST`, `OUTSIDE_WORKING_HOURS`.

## Архітектура frontend

`apps/web/src` використовує feature-based структуру:

```text
app/                providers, router, protected routes
pages/              login, register, schedule, my-bookings, not-found
features/auth/      API, schemas, hooks, auth layout
features/rooms/     API і query hooks
features/bookings/ API, schemas, hooks, booking form/details
features/schedule/ custom WeekCalendar, columns, booking cards, time indicator
components/         shell і UI primitives
lib/                typed API client, QueryClient, dates, timezone
styles/             shared CSS/Tailwind entry point
```

TanStack Query зберігає server state, форми використовують React Hook Form + Zod, локальні UI-вікна — `useState`. Глобальний Redux store не потрібен.

## Auth і API

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/rooms
GET  /api/rooms/availability?at=ISO_DATETIME
GET  /api/rooms/:roomId/bookings?weekStart=YYYY-MM-DD
POST /api/bookings
DELETE /api/bookings/:bookingId
GET  /api/bookings/my?type=upcoming|past&page=1&limit=20
```

Auth — cookie-based session. Cookie `httpOnly`, `secure` у production, `sameSite=lax`; сесія зберігається у PostgreSQL таблиці `session` через `connect-pg-simple`.

## Час і конфлікти

Всі `Booking.startAt/endAt` зберігаються як UTC timestamps. Користувацький інтерфейс показує розклад у `Europe/Kyiv`; якщо timezone браузера інший, він показується біля розкладу.

Робочий час зберігається на кожній кімнаті в полях `workStartMinutes` і `workEndMinutes`. Seed задає для нових кімнат `09:00–19:00`, а повторний seed не перезаписує ручні зміни цих полів. Змінити час без адмінки можна напряму в PostgreSQL, наприклад:

```sql
UPDATE rooms
SET "workStartMinutes" = 480, "workEndMinutes" = 1080
WHERE name = 'Акваріум';
```

API повертає ці значення через `GET /api/rooms`, а календар і серверна перевірка бронювань використовують години вибраної кімнати.

Перетин інтервалів —

```text
existing.startAt < new.endAt && existing.endAt > new.startAt
```

Тому бронювання впритул не конфліктують. Чиста функція знаходиться у `modules/bookings/booking-overlap.ts` і покрита unit-тестами для всіх сценаріїв із ТЗ.

Захист від race condition має два рівні: service робить перевірку в транзакції перед insert, а PostgreSQL має `btree_gist` exclusion constraint на активні бронювання однієї кімнати та `tstzrange(startAt, endAt, '[)')`. Constraint є в SQL migration `apps/api/prisma/migrations/20260803000000_init/migration.sql`; його помилка нормалізується у `BOOKING_CONFLICT`.

## Seed

Seed створює або оновлює 6 кімнат, 6 користувачів і 6 бронювань на поточний/наступний тиждень. Повторний запуск не створює дублікати.

Тестові користувачі (усі мають пароль `roomly123`):

```text
Олена Коваль          · olena@example.com      / roomly123
Іван Петренко         · ivan@example.com       / roomly123
Владислав Герасимчук  · vladyslav@example.com  / roomly123
Марія Бондар          · maria@example.com      / roomly123
Андрій Шевченко       · andrii@example.com     / roomly123
Софія Мельник         · sofia@example.com      / roomly123
```

## Тести та перевірки

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Unit-тести перевіряють overlap rules, а Supertest перевіряє `/api/health` зі стандартним response envelope. Для повного booking/auth integration test потрібна запущена PostgreSQL база; основна архітектура і endpoints уже реалізовані, без fake data.

## Реалізовано з ТЗ

- auth register/login/logout/me, нормалізація email, bcrypt hash, server-side Zod validation;
- PostgreSQL + Prisma models User, Room, Booking, Session, indexes і active booking exclusion constraint;
- rooms, weekly room bookings, create/cancel booking, my upcoming/past bookings;
- правила title/duration/30-minute slots/future/UTC/conflicts і робочий час кожної кімнати;
- feature-based backend і frontend без FullCalendar/готових calendar components;
- CSS Grid календар із днями по горизонталі, часом вертикально, current-day/time indicator, own/other booking styles і click-to-book/details/cancel;
- loading, empty, error states, responsive shell, protected routes, typed API client з credentials і AbortSignal;
- Docker Compose з persistent PostgreSQL, healthchecks, automatic migration/seed, nginx SPA fallback і `/api` proxy;
- strict TypeScript, lint/format scripts, shutdown із Prisma/session disconnect.

## Оновлений workspace UI

Основний інтерфейс Roomly виконаний українською мовою у єдиній SaaS-системі: компактний top header із навігацією, responsive application shell, split-screen auth, кольорові картки переговорних, тижневий CSS Grid-календар, toast feedback, summary cards на сторінці «Мої бронювання» та окремий огляд переговорних з фільтром місткості.

У модальному створенні бронювання доступні ручні поля початку/кінця з кроком 30 хвилин, швидкі тривалості від 30 хвилин до 4 годин, локальна перевірка перетинів та пошук зареєстрованих учасників за email. Сервер повторює всі перевірки, а учасники зберігаються в `booking_participants`.

Додатковий endpoint для пошуку учасників: `GET /api/users?email=...`.

## Додатково реалізовано в hardening-гілці

- `GET /api/rooms/availability` повертає статус кімнати: вільна, зайнята або поза робочими годинами, а також час наступної доступності.
- Для бронювання сервер перевіряє місткість кімнати з урахуванням організатора та учасників.
- `GET /api/bookings/my` підтримує pagination metadata; frontend показує кнопку «Показати ще».
- Посилання з «Моїх бронювань» відкриває правильну кімнату, тиждень і деталі бронювання.
- Додані unit/Supertest-перевірки capacity, availability та API error contracts.

## Bonus / ще не реалізовано

Не входять до цього етапу: SMTP/email notifications, password reset, admin management UI, Google Calendar integration, recurring bookings, background worker/cron, OpenAPI/Swagger UI та browser push notifications. `NOTIFY_BEFORE_MINUTES` уже є в env для майбутнього notification worker.
