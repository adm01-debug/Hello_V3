# 📦 ESTRATÉGIA DE BACKUP - HELLO PROJECT

## 🎯 Objetivo

Garantir recuperação completa de dados em caso de:
- Falha de hardware
- Erro humano
- Corrupção de dados
- Desastre natural
- Ataque ransomware

---

## 📋 Políticas de Backup

### Frequência
- **Diário:** Backup completo às 02:00 UTC
- **Semanal:** Backup verificado aos domingos
- **Mensal:** Backup arquivado (retenção de 1 ano)

### Retenção
- **Diário:** 30 dias
- **Semanal:** 12 semanas
- **Mensal:** 12 meses
- **Anual:** 7 anos (compliance LGPD)

### Localização
- **Primário:** Server local (`/backups/hello`)
- **Secundário:** AWS S3 (`s3://hello-backups`)
- **Terciário:** Offsite backup (data center secundário)

---

## 🔄 Processo de Backup

### 1. Backup Automático
```bash
# Configurar cron job
crontab -e

# Adicionar linha:
0 2 * * * /path/to/scripts/backup/backup-database.sh
```

### 2. Verificação
```bash
# Verificar último backup
./scripts/backup/verify-backup.sh /backups/hello/db_YYYYMMDD_HHMMSS.sql.gz
```

### 3. Teste de Restore (Mensal)
```bash
# Em ambiente de teste
./scripts/backup/restore-backup.sh /backups/hello/db_YYYYMMDD_HHMMSS.sql.gz
```

---

## ⚡ Recuperação de Dados

### RTO (Recovery Time Objective): 1 hora
### RPO (Recovery Point Objective): 24 horas

### Procedimento de Emergência

**1. Identificar backup mais recente:**
```bash
ls -lth /backups/hello/ | head -5
```

**2. Verificar integridade:**
```bash
./scripts/backup/verify-backup.sh /backups/hello/db_LATEST.sql.gz
```

**3. Restaurar:**
```bash
./scripts/backup/restore-backup.sh /backups/hello/db_LATEST.sql.gz
```

**4. Validar:**
- Verificar contagem de registros
- Testar queries críticas
- Validar integridade referencial

---

## 📊 Monitoramento

### Alertas Configurados
- ❌ Backup falhou
- ⏰ Backup atrasado (> 30 min)
- 📁 Espaço em disco < 20%
- ☁️  Upload S3 falhou

### Dashboard
- Último backup: `YYYY-MM-DD HH:MM`
- Tamanho: `XXX MB`
- Status: `✅ OK` / `❌ FALHOU`

---

## 🔐 Segurança

### Encriptação
- Backups encriptados com AES-256
- Chaves armazenadas no AWS KMS
- Rotação de chaves trimestral

### Acesso
- Restrito a administradores
- Autenticação MFA obrigatória
- Logs de auditoria completos

---

## ✅ Checklist de Validação

Mensal:
- [ ] Backup executou com sucesso
- [ ] Backup foi verificado
- [ ] Backup foi enviado para S3
- [ ] Teste de restore funcionou
- [ ] Backups antigos foram limpos
- [ ] Espaço em disco suficiente
- [ ] Alertas funcionando

---

**Última atualização:** 25/12/2024  
**Responsável:** DevOps Team
