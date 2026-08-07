CREATE TABLE "booking_series" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "occurrenceCount" INTEGER NOT NULL,
    "firstStartAt" TIMESTAMPTZ(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Kyiv',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMPTZ(3),
    CONSTRAINT "booking_series_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bookings"
ADD COLUMN "seriesId" UUID,
ADD COLUMN "seriesIndex" INTEGER,
ADD COLUMN "isException" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "notifications"
ADD COLUMN "seriesId" UUID;

CREATE INDEX "booking_series_userId_createdAt_idx" ON "booking_series"("userId", "createdAt");
CREATE INDEX "booking_series_roomId_firstStartAt_idx" ON "booking_series"("roomId", "firstStartAt");
CREATE INDEX "bookings_seriesId_startAt_idx" ON "bookings"("seriesId", "startAt");
CREATE UNIQUE INDEX "bookings_seriesId_seriesIndex_key" ON "bookings"("seriesId", "seriesIndex");

ALTER TABLE "booking_series"
ADD CONSTRAINT "booking_series_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_series"
ADD CONSTRAINT "booking_series_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_seriesId_fkey"
FOREIGN KEY ("seriesId") REFERENCES "booking_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_seriesId_fkey"
FOREIGN KEY ("seriesId") REFERENCES "booking_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
