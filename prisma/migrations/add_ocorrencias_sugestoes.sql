-- Ocorrências profissionais + caixinha de sugestões do hóspede
-- Idempotente: pode rodar mais de uma vez. Não apaga dados.
-- Ocorrências já existentes ficam com category='OPERACIONAL' e source='PAINEL'.

BEGIN;

-- ─── 1. Occurrence: novas colunas ───────────────────────────────────────────

-- quem registrou passa a ser opcional (ex.: conta removida)
ALTER TABLE "Occurrence" ALTER COLUMN "reportedById" DROP NOT NULL;

-- origem: HOSPEDE | PRESTADOR | ANFITRIAO | GESTOR | PROPRIETARIO | ADMINISTRADOR | PAINEL
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "source"   TEXT NOT NULL DEFAULT 'PAINEL';
-- categoria: ELETRICA | HIDRAULICA | LIMPEZA | ROUPA_CAMA | ESTRUTURA | ELETRODOMESTICO
--            | INTERNET | FALTA_ITEM | OPERACIONAL | OUTRO | SUGESTAO
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'OPERACIONAL';

ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "reporterName"    TEXT;
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "reporterContact" TEXT;
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "reservationId"   TEXT;
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "assignedToId"    TEXT;
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "archivedAt"      TIMESTAMP(3);
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "convertedFromId" TEXT;

-- ─── 2. Occurrence: chaves estrangeiras ─────────────────────────────────────

-- reportedById opcional → ON DELETE SET NULL (padrão do Prisma para relação opcional)
ALTER TABLE "Occurrence" DROP CONSTRAINT IF EXISTS "Occurrence_reportedById_fkey";
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_reportedById_fkey"
  FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Occurrence_reservationId_fkey') THEN
    ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_reservationId_fkey"
      FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Occurrence_assignedToId_fkey') THEN
    ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Occurrence_convertedFromId_fkey') THEN
    ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_convertedFromId_fkey"
      FOREIGN KEY ("convertedFromId") REFERENCES "Occurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── 3. Occurrence: índices para as abas e filtros ──────────────────────────

CREATE INDEX IF NOT EXISTS "Occurrence_propertyId_idx"   ON "Occurrence"("propertyId");
CREATE INDEX IF NOT EXISTS "Occurrence_category_idx"     ON "Occurrence"("category");
CREATE INDEX IF NOT EXISTS "Occurrence_source_idx"       ON "Occurrence"("source");
CREATE INDEX IF NOT EXISTS "Occurrence_status_idx"       ON "Occurrence"("status");
CREATE INDEX IF NOT EXISTS "Occurrence_archivedAt_idx"   ON "Occurrence"("archivedAt");
-- rate limit da caixinha (5 por hóspede por dia)
CREATE INDEX IF NOT EXISTS "Occurrence_reportedById_createdAt_idx" ON "Occurrence"("reportedById", "createdAt");

-- ─── 4. OccurrenceEvent: linha do tempo ─────────────────────────────────────

-- type: CRIADA | STATUS | PRIORIDADE | ATRIBUIDA | COMENTARIO | RESOLVIDA
--       | ARQUIVADA | REABERTA | EDITADA | CONVERTIDA
CREATE TABLE IF NOT EXISTS "OccurrenceEvent" (
  "id"           TEXT         NOT NULL,
  "occurrenceId" TEXT         NOT NULL,
  "type"         TEXT         NOT NULL,
  "fromValue"    TEXT,
  "toValue"      TEXT,
  "message"      TEXT,
  "actorId"      TEXT,
  "actorLabel"   TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OccurrenceEvent_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OccurrenceEvent_occurrenceId_fkey') THEN
    ALTER TABLE "OccurrenceEvent" ADD CONSTRAINT "OccurrenceEvent_occurrenceId_fkey"
      FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OccurrenceEvent_actorId_fkey') THEN
    ALTER TABLE "OccurrenceEvent" ADD CONSTRAINT "OccurrenceEvent_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OccurrenceEvent_occurrenceId_createdAt_idx" ON "OccurrenceEvent"("occurrenceId", "createdAt");

-- ─── 5. Histórico das ocorrências antigas ───────────────────────────────────
-- Um evento CRIADA para cada ocorrência legada, para a linha do tempo não começar vazia.
INSERT INTO "OccurrenceEvent" ("id", "occurrenceId", "type", "toValue", "actorId", "actorLabel", "createdAt")
SELECT 'legacy_' || o."id", o."id", 'CRIADA', o."status"::text, o."reportedById",
       COALESCE('Painel – ' || u."name", 'Painel'), o."createdAt"
FROM "Occurrence" o
LEFT JOIN "User" u ON u."id" = o."reportedById"
WHERE NOT EXISTS (SELECT 1 FROM "OccurrenceEvent" e WHERE e."occurrenceId" = o."id")
ON CONFLICT ("id") DO NOTHING;

COMMIT;
