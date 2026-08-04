ALTER TABLE "rooms"
ADD COLUMN "workStartMinutes" INTEGER NOT NULL DEFAULT 540,
ADD COLUMN "workEndMinutes" INTEGER NOT NULL DEFAULT 1140;

ALTER TABLE "rooms"
ADD CONSTRAINT "rooms_working_hours_check"
CHECK (
  "workStartMinutes" >= 0
  AND "workStartMinutes" < "workEndMinutes"
  AND "workEndMinutes" <= 1440
  AND mod("workStartMinutes", 30) = 0
  AND mod("workEndMinutes", 30) = 0
);
