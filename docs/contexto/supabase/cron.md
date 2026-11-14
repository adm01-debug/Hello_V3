# Cron (pg_cron)

Horários em UTC. Execuções recentes em `cron-runs.md`.

| id | nome | schedule | ativo | database | usuário | comando |
|---|---|---|---|---|---|---|
| 4 | data-lake-flush-daily | `0 3 * * *` | sim | postgres | postgres | `SELECT net.http_post(       url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/data-lake-flush',       headers := jsonb_build_object(         'Content-Type', 'application/json',         'Authorization', 'Bearer [REDACTED_JWT]'       ),       body := jsonb_build_object('trigger', 'cron')     );` |
