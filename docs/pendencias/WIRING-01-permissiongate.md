# WIRING-01 — PermissionGate órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/auth/PermissionGate.tsx` existe (componente pronto), **0 importadores** em todo src/ (confirmado por grep). `usePermissions` existe.
- **O que falta:** usar PermissionGate na UI para espelhar o controle de acesso por papel que o servidor impõe.
- **Camadas:** UI, permissões.
- **Raio de impacto:** todas as telas que renderizam conteúdo por papel; PermissionGate não toca banco.
- **Critério de aceite:** componente importado e usado em ≥1 tela admin/supervisor; typecheck+lint+testes verdes.
- **Bloqueio:** sem acesso a banco para verificar RLS de produção, mas o wiring é verificável por typecheck/build.
- **Estado:** PARCIAL — documentado, aguarda implementação com verificação local.
