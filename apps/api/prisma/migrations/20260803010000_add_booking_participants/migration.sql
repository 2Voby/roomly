CREATE TABLE "booking_participants" (
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_participants_pkey" PRIMARY KEY ("bookingId", "userId")
);

CREATE INDEX "booking_participants_userId_idx" ON "booking_participants"("userId");

ALTER TABLE "booking_participants"
ADD CONSTRAINT "booking_participants_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_participants"
ADD CONSTRAINT "booking_participants_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
