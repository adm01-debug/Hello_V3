# 📜 SCRIPTS DE UPLOAD PARA GITHUB

Scripts automatizados para enviar as 308 melhorias ao GitHub com segurança e verificação completa.

---

## 🚀 INÍCIO RÁPIDO

```bash
# 1. Executar verificação prévia
./pre-check.sh

# 2. Executar upload completo
./0-master-upload.sh
```

---

## 📋 SCRIPTS DISPONÍVEIS

### `pre-check.sh` - Verificação Prévia
**O que faz:**
- Verifica se GitHub CLI está instalado
- Verifica autenticação
- Verifica repositório local
- Verifica arquivos de origem
- Verifica ferramentas necessárias

**Quando usar:** Antes de começar qualquer coisa

---

### `0-master-upload.sh` - Script Master
**O que faz:**
- Executa TODOS os passos sequencialmente
- Pede confirmação antes de cada etapa
- Executa verificação final

**Quando usar:** Para fazer tudo automaticamente

---

### `1-audit-repository.sh` - Auditoria
**O que faz:**
- Conecta com GitHub via API
- Lista arquivos no repositório
- Compara com arquivos locais
- Mostra o que será adicionado/modificado

**Quando usar:** Para ver o que será enviado

---

### `2-prepare-files.sh` - Preparação
**O que faz:**
- Cria backup do repositório
- Cria branch de feature
- Copia TODOS os arquivos
- Verifica integridade

**Quando usar:** Para preparar arquivos antes do commit

---

### `3-commit-and-push.sh` - Commit e Push
**O que faz:**
- Cria 16 commits organizados
- Pergunta antes de fazer push
- Envia para GitHub

**Quando usar:** Para enviar ao GitHub

---

### `4-verify-upload.sh` - Verificação
**O que faz:**
- Verifica se tudo foi enviado
- Compara local com GitHub
- Verifica arquivos críticos
- Gera relatório completo

**Quando usar:** Após o upload, para confirmar

---

## 📊 FLUXO COMPLETO

```
┌─────────────────┐
│  pre-check.sh   │ ← Verificação prévia
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1-audit-repo    │ ← Auditoria GitHub
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2-prepare-files │ ← Preparação
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3-commit-push   │ ← Commit & Push
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4-verify-upload │ ← Verificação
└─────────────────┘
```

---

## 🎯 EXEMPLOS DE USO

### Uso Automático (Recomendado)
```bash
./pre-check.sh && ./0-master-upload.sh
```

### Uso Manual (Passo a Passo)
```bash
# Verificar pré-requisitos
./pre-check.sh

# Auditar
./1-audit-repository.sh

# Preparar
./2-prepare-files.sh

# Commitar e enviar
./3-commit-and-push.sh

# Verificar
./4-verify-upload.sh
```

### Apenas Verificar (Sem Enviar)
```bash
./1-audit-repository.sh
./2-prepare-files.sh
# Parar aqui - não executa commit
```

---

## 📝 LOGS

Todos os scripts salvam logs em `/tmp/`:
- `/tmp/repo_info.json` - Info do repositório
- `/tmp/repo_tree.json` - Árvore de arquivos GitHub
- `/tmp/github_tree.json` - Arquivos no GitHub
- `/tmp/rsync_*.log` - Logs de cópia

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente (Opcional)

```bash
# Customizar diretórios
export HELLO_SOURCE="/caminho/customizado/fonte"
export HELLO_TARGET="/caminho/customizado/repo"

# Executar scripts
./0-master-upload.sh
```

---

## 🚨 TROUBLESHOOTING

### Erro: "GitHub CLI não instalado"
```bash
# Mac
brew install gh

# Ubuntu
sudo apt install gh
```

### Erro: "Não autenticado"
```bash
gh auth login
```

### Erro: "Repositório não encontrado"
```bash
git clone https://github.com/adm01-debug/hello.git ~/projects/hello
```

### Script travou
```bash
# Ctrl+C para cancelar
# Revise backup em ~/projects/hello-backup-*
# Execute novamente
```

---

## 🛡️ SEGURANÇA

- ✅ Cria backup antes de modificar
- ✅ Pede confirmação antes de push
- ✅ Verifica integridade de arquivos
- ✅ Não sobrescreve sem confirmar
- ✅ Logs completos de todas as operações

---

## 📞 SUPORTE

Consulte: `GUIA_UPLOAD_GITHUB.md` para guia completo

---

**Criado em:** 23/12/2025
