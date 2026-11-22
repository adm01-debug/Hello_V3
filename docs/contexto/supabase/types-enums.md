# Tipos customizados (enums, domains, composites)

| tipo | kind | valores / definição | usado em |
|---|---|---|---|
| public.dblink_pkey_results | composite | position integer, colname text |  |
| public.app_role | enum | admin, supervisor, agent, viewer | public.role_permissions.role, public.user_roles.role |
| public.voip_provider | enum | nvoip, directcall, totalvoice, generic, wavoip | public.voip_trunks.provider |
