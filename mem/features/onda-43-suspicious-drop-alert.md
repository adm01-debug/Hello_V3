---
name: Onda 43 - Alerta de varredura suspeita de DROP INDEX
description: Trigger em index_drop_audit dispara notificação crítica aos outros admins quando um admin copia >5 comandos DROP INDEX em 24h. Debounce 24h por admin. Protege contra contas comprometidas.
type: feature
---

Função `notify_suspicious_index_drop_activity()` (SECURITY DEFINER, AFTER INSERT em `index_drop_audit`). Threshold: >5 cópias/24h por admin. Notifica todos os OUTROS admins (revisão cruzada, nunca o próprio autor). Debounce 24h via `source_type='suspicious_index_drop_activity'` + `source_id=admin_id`. Falhas de notificação são silenciadas para nunca bloquear o INSERT principal. Metadata inclui admin_id, admin_email, count_last_24h, último índice/tabela e detected_at.
