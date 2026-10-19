-- Sincronização dos canais iCal a cada 10 min: pg_cron chama a rota da Vercel via pg_net.
-- O CRON_SECRET fica no Supabase Vault (nome 'staymet_cron_secret'), nunca neste arquivo.
-- Idempotente: cron.schedule com o mesmo nome atualiza o job existente.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'staymet-ical-sync',
  '*/10 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://staymet.somar.ia.br/api/cron/ical-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'staymet_cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
