-- Instrução de entrega específica por estabelecimento (MERCADO, RESTAURANTE, DELIVERY).
-- Vazio = o guia usa o "Endereço padrão para entregas" do imóvel (Property.deliveryInstructions).
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "deliveryNote" TEXT;
