-- Guia do Hóspede: links dos parceiros, ordenação e instruções para entregadores
-- Idempotente: pode rodar mesmo que add_partner_links_delivery_instructions.sql já tenha sido aplicado
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "whatsappUrl" TEXT;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "externalUrl" TEXT;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "deliveryInstructions" TEXT;
