-- Guia do hóspede: link amigável (slug), localização no mapa e interruptor da caixinha de sugestões.
-- Idempotente e só aditivo: não altera dados existentes (slug começa vazio; o painel gera ao salvar).
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "locationUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "suggestionsEnabled" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS "Property_slug_key" ON "Property"("slug");
