-- Contador de uso do Guia do Hóspede: aberturas do guia, dos cards e ações finais (WhatsApp, ligar, rota...).
-- Sem dado pessoal do hóspede. Só acréscimos; idempotente.

CREATE TABLE IF NOT EXISTS "GuideEvent" (
  "id"            TEXT NOT NULL,
  "propertyId"    TEXT NOT NULL,
  "partnerId"     TEXT,
  "cardKey"       TEXT NOT NULL,
  "action"        TEXT NOT NULL,
  "bookingSource" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuideEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GuideEvent_propertyId_createdAt_idx" ON "GuideEvent"("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "GuideEvent_partnerId_createdAt_idx" ON "GuideEvent"("partnerId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "GuideEvent" ADD CONSTRAINT "GuideEvent_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GuideEvent" ADD CONSTRAINT "GuideEvent_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
