CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "roomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMPTZ(3),
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");
CREATE INDEX "bookings_roomId_startAt_idx" ON "bookings"("roomId", "startAt");
CREATE INDEX "bookings_userId_startAt_idx" ON "bookings"("userId", "startAt");
CREATE INDEX "bookings_startAt_idx" ON "bookings"("startAt");
CREATE INDEX "bookings_cancelledAt_idx" ON "bookings"("cancelledAt");
CREATE INDEX "session_expire_idx" ON "session"("expire");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_active_room_time_excl"
EXCLUDE USING gist (
  "roomId" WITH =,
  tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("cancelledAt" IS NULL);
