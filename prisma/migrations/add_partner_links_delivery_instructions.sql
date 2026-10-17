-- Adiciona links (WhatsApp / externo) aos parceiros e instruções para entregadores ao imóvel
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "whatsappUrl" TEXT;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "externalUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "deliveryInstructions" TEXT;
