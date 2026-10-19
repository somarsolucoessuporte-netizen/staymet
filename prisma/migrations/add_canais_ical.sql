-- Canais (Fase 1): calendário único por imóvel via iCal (Airbnb, Booking, Vrbo, OLX, diretas). Só acréscimos.

DO $$ BEGIN
  CREATE TYPE "BookingSource" AS ENUM ('AIRBNB', 'BOOKING', 'VRBO', 'OLX', 'DIRETO', 'OUTRO', 'BLOQUEIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelPlatform" AS ENUM ('AIRBNB', 'BOOKING', 'VRBO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelSyncStatus" AS ENUM ('OK', 'ERRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Token secreto dos links de exportação (.ics)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "icalToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Property_icalToken_key" ON "Property"("icalToken");

CREATE TABLE IF NOT EXISTS "CalendarChannel" (
  "id"         TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "platform"   "ChannelPlatform" NOT NULL,
  "label"      TEXT NOT NULL,
  "importUrl"  TEXT NOT NULL,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP(3),
  "lastStatus" "ChannelSyncStatus",
  "lastError"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarChannel_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CalendarChannel_propertyId_idx" ON "CalendarChannel"("propertyId");

DO $$ BEGIN
  ALTER TABLE "CalendarChannel" ADD CONSTRAINT "CalendarChannel_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- endDate = dia do check-out (exclusivo)
CREATE TABLE IF NOT EXISTS "Booking" (
  "id"           TEXT NOT NULL,
  "propertyId"   TEXT NOT NULL,
  "source"       "BookingSource" NOT NULL,
  "channelId"    TEXT,
  "externalUid"  TEXT,
  "startDate"    DATE NOT NULL,
  "endDate"      DATE NOT NULL,
  "status"       "BookingStatus" NOT NULL DEFAULT 'CONFIRMADA',
  "guestName"    TEXT,
  "guestContact" TEXT,
  "guestsCount"  INTEGER,
  "amount"       DECIMAL(10,2),
  "notes"        TEXT,
  "createdById"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_channelId_externalUid_key" ON "Booking"("channelId", "externalUid");
CREATE INDEX IF NOT EXISTS "Booking_propertyId_startDate_idx" ON "Booking"("propertyId", "startDate");

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "CalendarChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
