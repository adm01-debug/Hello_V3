# 00 — Resumo para o dono

> **O que é isto:** uma auditoria de qualidade do sistema inteiro, feita em 2026-11-22/23 sobre o código que está no ar (commit `b712310`). Sem jargão. Uma página.
> **O que vem com ela:** 133 problemas com endereço exato no código e um plano de 300 passos que outro agente executa sem precisar falar comigo.

---

## 1. Em uma frase

O sistema é grande e bem construído na base — mas **as ligações não estão sendo gravadas**, e por isso todo relatório, ranking e painel do produto mostra zero ou um número inventado. O conserto principal é um fio solto, não uma reescrita.

## 2. O que eu encontrei de mais importante

**O sistema não registra as chamadas.** Existe o código que grava a ligação no banco, existe a tela, existe a telefonia de verdade — mas o único lugar do sistema que dispara a gravação é um componente que **nunca aparece na tela**. Resultado: o banco de produção registra **zero chamadas nos últimos 7 dias**, e histórico, relatórios, ranking de agentes, avaliações e métricas de fila estão todos em zero por consequência.

**E os painéis escondem isso.** Três painéis de saúde exibem números que não vêm de lugar nenhum — "crescimento de 12%", "Health Score 9.8", "SIP Gateway 45ms", "Auditoria de Segurança 10/10" são texto fixo no código. A página pública de status anuncia "Todos os sistemas operacionais" e 100% de disponibilidade **justamente porque não há medição nenhuma**: quando falta dado, o sistema trata isso como "está tudo bem". O cartão executivo de saúde da telefonia dá nota **83 de 100 e o rótulo "SAUDÁVEL"** com a base vazia.

É essa combinação que importa: o produto parou de registrar o trabalho e nenhum instrumento avisou.

## 3. Os 10 maiores riscos, em ordem

| # | Risco | O que acontece na prática |
|---|---|---|
| 1 | **As ligações não são gravadas** | Nenhum atendimento entra no histórico. Relatório, ranking, avaliação e cobrança de meta ficam sem base. |
| 2 | **Os painéis não conseguem ficar vermelhos** — *provado com a tela aberta* | Abri a página pública `/status` com o banco **inacessível**: ela anunciou **"Todos os sistemas operacionais"**, **100,00%** nos dois serviços, e no rodapé *"SLA contratual: 99,9% mensal. Métricas alimentadas diretamente pelos health checks internos — sem edição manual"*. Uma queda real não gera chamado, e a página promete ao cliente que o número veio de medição. |
| 3 | **Qualquer estranho trava o acesso de qualquer operador** | Sabendo só o e-mail de um funcionário, uma pessoa de fora consegue bloquear a conta dele — e também zerar o contador de tentativas para testar senhas sem limite. |
| 4 | **A busca nas gravações de chamada não pede login** | Quem alcançar esse endereço consegue pesquisar o conteúdo das ligações gravadas, com privilégio de serviço (sem as restrições por usuário). |
| 5 | **Uma das telas de discagem ignora a lista "não perturbe"** | Discando pela tela `/calls` em vez da `/phone-dialer`, é possível ligar para quem pediu para não ser ligado e fora do horário legal. Risco de multa. |
| 6 | **A importação da lista "não perturbe" conta sucesso mesmo quando o banco recusa** | Um lote de números pode não entrar na lista e a tela informa que entrou. Depois o discador liga para essas pessoas. |
| 7 | **As senhas das linhas telefônicas não estão de fato criptografadas** | A proteção usada não é criptografia; quem obtiver uma cópia da tabela recupera as senhas e passa a originar chamadas na conta da empresa. E trocar a chave principal do banco deixaria todas as senhas ilegíveis, derrubando a telefonia. |
| 8 | **O discador pode ligar duas vezes para a mesma pessoa** | Dois agentes (ou duas abas) na mesma campanha pegam o mesmo contato. Hoje o efeito é menor porque o discador não liga de verdade; quando ligar, liga em dobro. |
| 9 | **O repositório de código é público com as proteções desligadas** | Está tudo visível na internet, e os bloqueios automáticos do GitHub contra vazamento de senha estão desativados. Hoje **não há nenhuma credencial real no código** — isso foi verificado —, mas nada impede a próxima. |
| 10 | **Dá para enviar "alerta de segurança" em nome da empresa para qualquer endereço** | Dois endereços do sistema aceitam, sem pedir login, o destinatário e o texto de um e-mail que sai com o remetente verificado da empresa. |

**Dois indicadores de negócio estão com duas contas diferentes:** nível de serviço (20 ou 30 segundos, dependendo da tela) e taxa de abandono (uma conta para o painel, outra para o freio do discador — e a do freio dá sempre menor, então o discador acelera enquanto o painel reclama). Isso não entra no top 10 porque hoje os dois estão zerados pelo risco nº 1, mas vira o problema seguinte no dia em que as chamadas começarem a ser gravadas.

## 4. Contagem

| Gravidade | Quantos | O que significa |
|---|---:|---|
| **Crítica** | **9** | perda ou vazamento de dado, falha de segurança, ou fluxo principal quebrado |
| **Alta** | **55** | função importante falha ou dá resultado errado |
| **Média** | **55** | funciona com defeito ou fragilidade |
| **Baixa** | **18** | acabamento e organização |
| **Total** | **137** | mais 1 resultado positivo registrado |

**O plano:** 300 passos, em 8 ondas, na ordem em que devem ser feitos. Cada passo é uma mudança pequena, com o endereço no código, como verificar que funcionou, e o que **não** mexer. **107 deles precisam da sua aprovação** antes de entrar em produção (mudança no banco, segredos, infraestrutura, exclusão de dado, ou decisão de custo) — esses ficam esperando você.

## 5. Vale dizer: muita coisa melhorou desde agosto

A auditoria anterior (2026-08-16) apontava problemas que **já foram resolvidos** e continuam escritos como pendência na documentação do projeto. Medido por mim agora:

- a chave de acesso total do banco **não está mais no código** — nenhuma credencial real está versionada;
- o processo automático de verificação (CI) estava vermelho há 30 execuções seguidas; **hoje está verde**;
- os testes automatizados passam (3.289) e a verificação de tipos não tem um único erro em ~165 mil linhas;
- os testes de ponta a ponta **rodam** no processo automático (a documentação diz que não);
- 466 arquivos de lixo de build saíram do repositório;
- a telefonia é real (não é simulação), a estrutura de permissões do banco é sólida (163 tabelas, nenhuma sem controle de acesso) e as rotas são todas carregadas sob demanda.

**O problema não é falta de engenharia. É que a camada que deveria dizer se o sistema está bem foi construída como decoração** — e isso faz o sistema parecer mais pronto do que está. Essa é a mesma conclusão de agosto, e ela continua valendo.

## 6. O que eu não consegui verificar

Declarado, não escondido — e importante, porque limita o que afirmo:

| Não coberto | Por quê |
|---|---|
| **O banco de dados por dentro** (dados reais, quais regras de acesso valem de fato, quais alterações de estrutura foram aplicadas) | Não existe conexão com o banco oficial nesta sessão: as conexões disponíveis apontam para outros produtos seus, e usá-las seria ler banco alheio. O endereço do banco certo é bloqueado pela rede do ambiente. **Tudo o que afirmo sobre o banco vem de arquivos ou de um retrato automático de 2026-11-20.** |
| **As telas de dentro do sistema** | Abri **as 10 páginas públicas** em navegador, em 3 larguras (30 capturas) — e isso rendeu 3 problemas novos e um resultado positivo. As telas **de dentro** (que exigem login) continuam sem verificação: entrar exigiria credenciais reais e tráfego contra produção. Os passos 270 a 275 existem para isso. |
| **Testes das funções de backend** | A ferramenta necessária não está instalada no ambiente. Os arquivos foram lidos, nunca executados. |
| **Qual endereço serve a produção** | Descobri que a trilha da Vercel **está ativa** e publica cada alteração (projeto `hello-v3`). Falta você me dizer qual endereço você e os usuários abrem. Passo 030. |
| **Se os ajustes chegaram mesmo ao ar** | **Isto depende de você, e vale para o plano inteiro.** A conta Vercel ligada às sessões de agente **não tem acesso** ao projeto do produto, e a rede do ambiente bloqueia tanto o endereço do site quanto o do banco. Enquanto for assim, nenhum agente consegue cumprir a sua própria regra de "pronto = no ar e verificado" — o máximo que ele consegue dizer é "mesclado". |
| **Se o telefone funciona de verdade hoje** | A única linha telefônica cadastrada é `sip.exemplo.com`, de teste, sem nenhuma verificação de saúde, e com zero chamadas em 7 dias. **Pelo que o banco mostra, não há operação telefônica acontecendo.** Se isso estiver errado, me diga: muda a prioridade do plano. |

## 6b. Uma correção na própria auditoria

Depois de fechar a primeira versão, percebi que este ambiente tinha navegador instalado — ou seja, a camada que eu havia declarado como impossível de verificar era, em parte, alcançável. Abri as 10 páginas públicas. O resultado justificou: **provei em execução** o risco nº 2 (que antes era leitura de código), achei 3 problemas novos (toda página pública consulta o banco e abre conexão de tempo real; a tela de login manda o IP de quem entra para um serviço de fora; os dois botões de "mostrar senha" do cadastro não funcionam com leitor de tela) — e **uma hipótese minha foi refutada pela execução**: eu havia escrito que a página de status travaria em "carregando" quando o banco falhasse, e ela não trava; mostra 100%. Está corrigido no documento de achados.

Fica a lição para o plano: onde houver como executar, executar — ler o código é a segunda melhor coisa.

## 6c. Uma coisa que só você pode destravar

A regra do projeto diz que algo só está **pronto** quando está no ar e com o comportamento verificado. Com a configuração atual, isso é **impossível** para qualquer agente: a conta Vercel conectada não enxerga o projeto do produto (erro de permissão, medido), a rede do ambiente bloqueia o endereço do site, e não existe acesso ao banco oficial. Isso provavelmente explica parte de como o sistema chegou a ter documentos declarando conclusão sem verificação — **a verificação era literalmente inalcançável**.

Três pedidos, e eles valem mais que qualquer passo do plano:
1. conectar, nas sessões de agente, a conta Vercel que hospeda o projeto `hello-v3`;
2. liberar na rede do ambiente o endereço do site e o do banco (`*.vercel.app` e o host do Supabase);
3. dar acesso de leitura ao banco oficial `cfmlmcdyjuotqobjapng`.

Sem isso, boa parte das 300 etapas vai terminar marcada como **parcial** — aplicada, mas não verificada.

## 7. Por onde começar

Se você fizer **três coisas** desta auditoria, faça estas:

1. **Passos 056 a 065** — fazem a ligação voltar a ser gravada. Sem isso, nada mais no produto mede nada.
2. **Passo 002** — fecha o furo que deixa um estranho travar a conta de qualquer funcionário.
3. **Passos 092 a 099** — fazem os painéis dizerem "sem medição" em vez de "tudo certo". É o que permite confiar em qualquer número depois.

O resto está em ordem de impacto no arquivo `04-PLANO.md`.

---

## Onde estão os arquivos

| Arquivo | Para quê |
|---|---|
| **`00-RESUMO.md`** | este documento |
| `01-INVENTARIO.md` | o mapa do sistema e o registro honesto do que foi e do que não foi revisado |
| `02-CENARIOS.md` | 113 situações testadas por jornada (29 executadas de verdade, 84 seguidas pelo código) |
| `03-ACHADOS.md` | os 137 problemas, agrupados por causa, cada um com o endereço no código |
| `04-PLANO.md` | os 300 passos e as instruções para quem vai executar |
| `05-PROGRESSO.md` | a lista que o executor vai marcando, mais as 19 decisões que dependem de você |
