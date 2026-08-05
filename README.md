# 📞 Bitrix Call Connect - VoIP Enterprise & AI Intelligence

Bitrix Call Connect é uma plataforma de telefonia VoIP de próxima geração, integrada nativamente ao Bitrix24 e potencializada por Inteligência Artificial. O sistema oferece uma arquitetura resiliente, segura e focada na excelência da experiência do usuário (UX) com o padrão visual Neon.

---

## 🌟 Visão Geral

O sistema atua como o hub central de comunicações para operações enterprise, permitindo não apenas a realização de chamadas, mas a análise profunda de cada interação através de processamento de linguagem natural (NLP) e métricas operacionais em tempo real.

## 🏗️ Principais Módulos

### 1. **Core VoIP & Softphone**
- Discador WebRTC de alta performance.
- Gestão de Troncos SIP e monitoramento de saúde de infraestrutura.
- Provisionamento por QR Code para dispositivos móveis.

### 2. **AI Intelligence (Powered by Lovable & Gemini)**
- **Análise de Sentimento:** Identificação do humor de clientes e agentes em tempo real.
- **Busca Semântica:** Base de conhecimento vetorial (RAG) para auxílio dinâmico aos agentes.
- **Sumarização Automática:** Resumos executivos de reuniões e chamadas.

### 3. **Segurança & Resiliência**
- **Autenticação Avançada:** Suporte a MFA e Passkeys (WebAuthn).
- **Hardening de Rede:** Monitoramento de latência e controle de acesso por IP/Geolocalização.
- **Fila de Sincronização:** Sistema de retentativa inteligente (Backoff Exponencial) para integração CRM.

### 4. **Gestão Operacional & Gamificação**
- Dashboards de SLA, Rank e Desempenho.
- Sistema de badges e conquistas (Gamificação).
- Monitoramento de aderência e escalas de trabalho.

---

## 🛠️ Como Rodar Localmente

### Pré-requisitos
- [Bun](https://bun.sh/) instalado.
- Conta no [Supabase](https://supabase.com/).

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   # Use a URL do seu repositório Git
   git clone <url-do-repositorio>
   cd bitrix-call-connect
   ```

2. **Instalar dependências:**
   ```bash
   bun install
   ```

3. **Configurar Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
   ```

4. **Executar o ambiente de desenvolvimento:**
   ```bash
   bun run dev
   ```
   O sistema estará disponível em `http://localhost:8080`.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Storage).
- **IA/ML:** Gemini API (via Lovable AI Gateway), pgvector.
- **Comunicação:** WebRTC, SIP.js.

---
*Este projeto é mantido com foco em maturidade técnica 10/10 e excelência operacional.*
