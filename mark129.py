import io, re
p = 'docs/qa/05-PROGRESSO.md'
s = io.open(p, encoding='utf-8').read()

ev = (' · (sonda `probe_129_polymorphic_rls_test.sql` no run 45865868536 levantou os valores reais: '
      '`audit_logs.resource_type` com 15 valores — `contacts` 107, `SYSTEM` 100, `user_profiles` 78, `agents` 20, '
      '`contact` 8, `user_roles` 6, `consent_record` 3, `webhook` 3, `edge_function` 3, `call_recordings` 3, '
      '`api_endpoint` 2, `voip_trunks` 2, `system` 2, `call_transcription` 1, `call_analysis` 1 —, '
      '`notifications.source_type` com 3 (`cron_health` 16, `optimistic_lock_hotspot` 3, `idle_index_hotspot` 1, '
      'que não é nome de tabela) e `optimistic_lock_conflicts.table_name` com 2 (`deals` 4, `contacts` 3); as seis '
      'colunas estavam sem `COMMENT`. Migration `20261127220000_polymorphic_pointer_comments.sql` — dry-run '
      '45866723578 (`COMMENT` ×6 + `ROLLBACK`), apply 45867325691 registrado em `schema_migrations`; mapa '
      'tipo→tabela documentado em `docs/agentes/banco.md`; gate `polymorphic_pointer_comments_rls_test.sql` '
      '3/3 no run 45867746660, inclusive provando que nenhum `CHECK` foi criado antes da etapa 139. '
      'Grafias conviventes `contacts`/`contact` e `SYSTEM`/`system` ficaram registradas para a normalização da 139.)')

m = re.search(r'^- \[ \] \*\*129\*\*[^\n]*$', s, re.M)
assert m, 'linha 129 nao encontrada'
linha = m.group(0).replace('- [ ] **129**', '- [x] **129**', 1) + ev
s = s[:m.start()] + linha + s[m.end():]

s = s.replace('| `[x]` concluídas | 155 |', '| `[x]` concluídas | 156 |', 1)
s = s.replace('| `[ ]` não iniciadas | **143** |', '| `[ ]` não iniciadas | **142** |', 1)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('mark ok')