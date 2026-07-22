import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { MarketingLayout } from "./MarketingLayout";

const plans = [
  {
    name: "Starter",
    price: "R$ 149",
    unit: "/agente/mês",
    tagline: "Ideal para times até 10 agentes começando com discador em nuvem.",
    features: [
      "Discador preditivo com IA",
      "Gravação e qualificação de chamadas",
      "Receptivo com filas priorizadas",
      "Relatórios operacionais",
      "Suporte por chat em <5 min",
    ],
    cta: "Começar agora",
    ctaTo: "/register",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "R$ 299",
    unit: "/agente/mês",
    tagline: "Time comercial ou CX que precisa de omnichannel + IA na conversa.",
    features: [
      "Tudo do Starter",
      "Omnichannel WhatsApp com IA que aprimora mensagens",
      "Inteligência de conversa: talk ratio, sentimento, key moments",
      "Sales Enablement: deals, cadências, forecast",
      "Coaching por IA com playlists",
      "Integração nativa Bitrix24",
    ],
    cta: "Agendar demo",
    ctaTo: "/landing#demo",
    highlighted: true,
    badge: "Mais popular",
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    unit: "",
    tagline: "Operações de 100+ agentes com compliance, WFM e observabilidade.",
    features: [
      "Tudo do Growth",
      "Workforce Management (escalas, adherence, forecast de volume)",
      "Voice Biometrics + anti-fraude",
      "Multilíngue com tradução em tempo real",
      "Anomaly detection e auto-remediation de trunks",
      "SLA dedicado + CSM",
      "SSO/SAML, auditoria avançada, dedicated tenant",
    ],
    cta: "Falar com vendas",
    ctaTo: "/landing#demo",
    highlighted: false,
  },
];

const comparisonRows = [
  { feature: "Discador preditivo com IA", starter: true, growth: true, enterprise: true },
  { feature: "Omnichannel WhatsApp + IA de mensagens", starter: false, growth: true, enterprise: true },
  { feature: "Inteligência de Conversa (talk ratio, sentimento)", starter: false, growth: true, enterprise: true },
  { feature: "Sales Enablement (deals, cadências, forecast)", starter: false, growth: true, enterprise: true },
  { feature: "Integração nativa Bitrix24", starter: false, growth: true, enterprise: true },
  { feature: "Workforce Management", starter: false, growth: false, enterprise: true },
  { feature: "Voice Biometrics anti-fraude", starter: false, growth: false, enterprise: true },
  { feature: "Multilíngue + tradução em tempo real", starter: false, growth: false, enterprise: true },
  { feature: "SSO / SAML", starter: false, growth: false, enterprise: true },
  { feature: "SLA dedicado + CSM", starter: false, growth: false, enterprise: true },
];

export default function Pricing() {
  return (
    <MarketingLayout
      title="Planos e preços — CallCenter Pro"
      description="Escolha o plano ideal para sua operação. Starter, Growth e Enterprise com discador, omnichannel, IA de conversa e compliance LGPD."
    >
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="outline" className="mb-4 border-primary/40 bg-primary/5 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Sem taxa de setup
        </Badge>
        <h1 className="text-4xl font-bold md:text-5xl">Planos que crescem com sua operação</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Cobrança mensal por agente ativo. Cancele quando quiser. Todos os planos incluem SLA público de suporte em menos de 45 segundos.
        </p>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-16 md:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={`relative flex flex-col p-8 transition-all ${
              p.highlighted
                ? "border-primary shadow-[0_0_40px_hsl(var(--primary)/0.25)]"
                : "border-border/50 hover:border-primary/40"
            }`}
          >
            {p.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                {p.badge}
              </Badge>
            )}
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.unit}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" variant={p.highlighted ? "default" : "outline"} size="lg">
              <Link to={p.ctaTo}>
                {p.cta}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ))}
      </section>

      <section className="container mx-auto px-4 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">Compare os planos em detalhe</h2>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Recurso</th>
                <th className="px-6 py-4 text-center font-semibold">Starter</th>
                <th className="px-6 py-4 text-center font-semibold text-primary">Growth</th>
                <th className="px-6 py-4 text-center font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((r, i) => (
                <tr key={r.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                  <td className="px-6 py-3">{r.feature}</td>
                  <td className="px-6 py-3 text-center">
                    {r.starter ? <CheckCircle2 className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {r.growth ? <CheckCircle2 className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {r.enterprise ? <CheckCircle2 className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MarketingLayout>
  );
}
