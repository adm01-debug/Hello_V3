import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageSquare,
  Headphones,
  Brain,
  ShieldCheck,
  Zap,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Activity,
} from "lucide-react";
import { MarketingLayout } from "./MarketingLayout";

const solutions = [
  {
    icon: Phone,
    title: "Discador Preditivo",
    tagline: "Fale com mais clientes em menos tempo.",
    features: [
      "Descarte automático de improdutivas",
      "Qualificação e gravação em nuvem",
      "3 modos de escuta: spy, sussurro e barge-in",
      "Machine learning para melhor horário",
    ],
  },
  {
    icon: MessageSquare,
    title: "Omnichannel + IA",
    tagline: "WhatsApp, voz e mensagens em uma tela.",
    features: [
      "Vários atendentes no mesmo número",
      "IA que aprimora tom e clareza da mensagem",
      "Roteamento inteligente por skill",
      "Histórico unificado por contato",
    ],
  },
  {
    icon: Headphones,
    title: "Receptivo & IVR Visual",
    tagline: "Cada chamada no lugar certo.",
    features: [
      "Filas com priorização por SLA",
      "Áudio de espera personalizado por fila",
      "Call Flow Designer drag-and-drop",
      "Transferência assistida entre operadores",
    ],
  },
];

const differentials = [
  {
    icon: Brain,
    title: "Inteligência de Conversa",
    text: "Talk ratio ao vivo, sentimento, momentos-chave, coaching por timestamp e playlists — a suíte Gong/Chorus embarcada.",
  },
  {
    icon: TrendingUp,
    title: "Sales Enablement",
    text: "Deals com health-score de IA, forecast assistido, cadências multi-touch, scorecards e trackers temáticos.",
  },
  {
    icon: Users,
    title: "Workforce Management",
    text: "Escalas, adherence em tempo real, sugestão de trocas de turno e previsão de volume por IA.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Segurança",
    text: "LGPD nativo, DNC, biometria de voz antifraude, validação geográfica e RLS em 100% das tabelas.",
  },
  {
    icon: Activity,
    title: "Observabilidade VoIP",
    text: "Anomaly detection, forecasting de qualidade, cockpit executivo e auto-remediation de trunks.",
  },
  {
    icon: Sparkles,
    title: "Multilíngue + Tradução",
    text: "Suporte a atendimentos internacionais com tradução em tempo real e transcrição diarizada.",
  },
];

const stats = [
  { label: "Uptime da plataforma", value: "99,95%" },
  { label: "Setup até 1ª chamada", value: "< 60 min" },
  { label: "Tempo médio de suporte", value: "< 45 s" },
  { label: "Módulos integrados", value: "40+" },
];

const testimonials = [
  {
    name: "Ricardo M.",
    role: "Head de Operações",
    text: "Reduzimos 38% do tempo ocioso do agente no primeiro mês. O coaching por IA transformou nosso onboarding.",
  },
  {
    name: "Carla S.",
    role: "Gerente de CX",
    text: "Migramos de outra ferramenta em 2 dias. O que mais me impressionou foi ver sentimento e talk ratio ao vivo na tela do supervisor.",
  },
  {
    name: "Bruno L.",
    role: "Diretor Comercial",
    text: "O forecast e o health-score de deals nos deram previsibilidade que planilha nenhuma dava.",
  },
];

const faqs = [
  {
    q: "Para quem é a plataforma?",
    a: "Operações de call center, inside sales, cobrança, SAC e CX que precisam de voz, WhatsApp e inteligência em uma única ferramenta.",
  },
  {
    q: "Quanto tempo leva para começar?",
    a: "Setup guiado leva menos de 60 minutos — do trunk SIP à primeira chamada. Time de onboarding acompanha em tempo real.",
  },
  {
    q: "Vocês são LGPD-compliant?",
    a: "Sim. Row-Level Security em 100% das tabelas, criptografia em trânsito e repouso, DNC, retenção configurável e trilha de auditoria completa.",
  },
  {
    q: "Integra com meu CRM?",
    a: "Integração nativa com Bitrix24 (sincronia bidirecional de agentes, departamentos e histórico). API aberta para HubSpot, RD, Pipedrive.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Alerta em tempo real dentro do app, SLA público de resposta em menos de 45 segundos e status page com uptime dos módulos.",
  },
  {
    q: "Posso testar antes de contratar?",
    a: "Sim — agende uma demonstração ao vivo. Nosso especialista faz um diagnóstico da sua operação e apresenta o plano ideal.",
  },
];

export default function Landing() {
  return (
    <MarketingLayout
      title="CallCenter Pro — Discador, Omnichannel e IA de Conversa em uma única plataforma"
      description="Plataforma unificada de call center com discador preditivo, omnichannel WhatsApp, inteligência de conversa por IA, sales enablement e compliance LGPD. Setup em menos de 60 minutos."
    >
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(circle_at_80%_60%,hsl(var(--chart-2)/0.12),transparent_50%)]" />
        <div className="container relative mx-auto grid gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="outline" className="mb-6 w-fit gap-2 border-primary/40 bg-primary/5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Nova geração de call center com IA nativa
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Venda, atenda e coache seu time com{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-[hsl(var(--chart-2))] bg-clip-text text-transparent">
                IA em cada chamada
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Discador preditivo, omnichannel WhatsApp, receptivo, inteligência de conversa, sales enablement e compliance LGPD — tudo em uma plataforma em nuvem, pronta em menos de 60 minutos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                <Link to="/landing#demo">
                  Agendar demo gratuita
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/vs/3cplus">Comparar com 3C Plus</Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-[hsl(var(--chart-2))]/20 blur-3xl" />
            <Card className="relative w-full max-w-md border-primary/20 bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="text-xs font-medium text-muted-foreground">Chamada ao vivo</span>
                </div>
                <span className="text-xs text-muted-foreground">02:47</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Sentimento</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[78%] bg-gradient-to-r from-success to-primary" />
                    </div>
                    <span className="text-xs font-semibold text-success">Positivo</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Talk ratio (agente/cliente)</div>
                  <div className="mt-1 flex gap-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="w-[42%] bg-primary" />
                    <div className="w-[58%] bg-[hsl(var(--chart-2))]" />
                  </div>
                  <div className="mt-1 text-xs font-semibold">42% / 58% • Ideal</div>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Sugestão IA
                  </div>
                  <div className="text-xs text-foreground">
                    Cliente mencionou preço 3x. Ofereça o plano Growth com desconto anual.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solucoes" className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Três produtos, uma plataforma</h2>
          <p className="mt-4 text-muted-foreground">
            Conecte voz e texto para dobrar a produtividade da sua equipe sem trocar de tela.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {solutions.map((s) => (
            <Card key={s.title} className="group relative overflow-hidden border-border/50 p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
              <ul className="mt-4 space-y-2">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Differentials */}
      <section id="ia" className="border-t border-border/40 bg-muted/10 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/40 bg-primary/5 text-primary">
              Onde ninguém no Brasil chega
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">6 módulos que a concorrência não tem</h2>
            <p className="mt-4 text-muted-foreground">
              Suítes completas de inteligência, vendas, workforce e observabilidade — nativas, não plugins.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {differentials.map((d) => (
              <div key={d.title} className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/40">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <d.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{d.title}</h3>
                <p className="text-sm text-muted-foreground">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implantação */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Implantação em menos de 60 minutos</h2>
          <p className="mt-4 text-muted-foreground">
            Do trunk SIP à primeira chamada guiada, com wizard visual e onboarding assistido.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "1", icon: Clock, title: "Solicitação", text: "Agende sua demo pelo formulário. Retorno em até 24h úteis." },
            { step: "2", icon: Zap, title: "Conexão", text: "Ativamos seu trunk, ramais e filas em uma sessão guiada de 40 min." },
            { step: "3", icon: Trophy, title: "Primeira chamada", text: "Você já está discando, gravando e coachando ao vivo." },
          ].map((s) => (
            <Card key={s.step} className="relative p-6">
              <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                {s.step}
              </div>
              <s.icon className="mt-2 mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/40 bg-muted/10 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Quem opera com a gente</h2>
            <p className="mt-4 text-muted-foreground">Times comerciais, CX e cobrança que dobraram produtividade.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <div className="mb-3 flex text-warning">{"★★★★★"}</div>
                <p className="text-sm italic">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto max-w-4xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-xl border border-border/50 bg-card p-5 open:border-primary/40">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {f.q}
                <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section id="demo" className="border-t border-border/40 py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <BarChart3 className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h2 className="text-3xl font-bold md:text-4xl">Veja em 20 minutos como podemos transformar sua operação</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Demonstração ao vivo com um especialista, adaptada ao seu volume e canais.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
              <Link to="/register">
                Criar conta e testar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">Ver planos</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
