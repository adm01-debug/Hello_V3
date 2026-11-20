# WIRING-01 — PermissionGate órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/auth/PermissionGate.tsx` existe (componente pronto), **0 importadores** em todo src/ (confirmado por grep). `usePermissions` existe.
- **O que falta:** usar PermissionGate na UI para espelhar o controle de acesso por papel que o servidor impõe.
- **Camadas:** UI, permissões.
- **Raio de impacto:** todas as telas que renderizam conteúdo por papel; PermissionGate não toca banco.
- **Critério de aceite:** componente importado e usado em ≥1 tela admin/supervisor; typecheck+lint+testes verdes.
- **Bloqueio:** sem acesso a banco para verificar RLS de produção, mas o wiring é verificável por typecheck/build.
- **Estado:** CONCLUÍDO (2026-11-20). `PermissionGate` agora é usado em `src/pages/admin/ExtensionsAdmin.tsx` (botão "Offline (N)" — ação destrutiva bulk), com `fallback` = mesmo botão → sem mudança de comportamento atual (permissões/role_permissions vazias → `hasPermission`/`canAccess` false → fallback renderiza; `loading` resolve rápido). Verificado por `npm run type-check` + `npm run lint` na branch `claude/feat-wiring-frontend-20261120-1622`.
