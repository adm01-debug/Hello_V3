# Cron (pg_cron)

Horários em UTC. Execuções recentes em `cron-runs.md`.

| id | nome | schedule | ativo | database | usuário | comando |
|---|---|---|---|---|---|---|
| 1 | update-contact-name-daily | `0 9 * * *` | sim | postgres | postgres | `     UPDATE public.contacts     SET        name = 'teste abner ' \|\| (         COALESCE(           NULLIF(regexp_replace(name, '^teste abner\s*', '', 'i'), ''),           '0'         )::integer + 1       )::text,       version = version + 1     WHERE id = '0699edd7-cb5f-4ab1-b3ec-55237edb3118'   ` |
| 2 | update-user-profile-fullname-daily | `0 9 * * *` | sim | postgres | postgres | `     UPDATE public.user_profiles     SET        full_name = 'Abner Pereira ' \|\| (         COALESCE(           NULLIF(regexp_replace(full_name, '^Abner Pereira\s*', '', 'i'), ''),           '0'         )::integer + 1       )::text     WHERE id = '7c353029-0585-46b3-8a0b-f8f3fb3a578a'   ` |
