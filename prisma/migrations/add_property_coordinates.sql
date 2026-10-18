-- Coordenadas exatas da casa (guia do hóspede: "Como chegar", Waze/Google Maps). Só acréscimo.
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
