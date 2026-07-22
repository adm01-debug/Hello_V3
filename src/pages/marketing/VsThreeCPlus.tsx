import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, ArrowRight, Trophy, Sparkles } from "lucide-react";
import { MarketingLayout } from "./MarketingLayout";

interface Row {
  category: string;
  feature: string;
  ours: boolean | string;
  competitor: boolean | string;
  note?: string;
}

const rows: Row[] = [
  // Core
  { category: "Core", feature: "Discador preditivo em nuvem", ours: true, competitor: true },
  { category: "Core", feature: "Gravação e qualificação", ours: true, competitor: true },
  { category: "Core", feature: "Receptivo com filas priorizadas", ours: true, competitor: true },
  { category: "Core", feature: "Áudio de espera personalizado por fila", ours: true, competitor: true },
  { category: "Core", feature: "IVR Visual drag-and-drop", ours: true, competitor: false, note: "Call Flow Designer" },

  // Omnichannel
  { category: "Omnichannel", feature: "WhatsApp multi-atendente", ours: true, competitor: true },
  { category: "Omnichannel", feature: "IA que aprimora tom e clareza da mensagem", ours: true, competitor: true },
  { category: "Omnichannel", feature: "Roteamento por skill + histórico unificado", ours: true, competitor: "parcial" },

  // Inteligência
  { category: "Inteligência de Conversa", feature: "Transcrição com diarização em tempo real", ours: true, competitor: false },
  { category: "Inteligência de Conversa", feature: "Talk ratio agente/cliente ao vivo", ours: true, competitor: false },
  { category: "Inteligência de Conversa", feature: "Sentimento em tempo real", ours: true, competitor: false },
  { category: "Inteligência de Conversa", feature: "Momentos-chave e battle cards", ours: true, competitor: false },
  { category: "Inteligência de Conversa", feature: "Coaching por timestamp + playlists", ours: true, competitor: false },

  // Sales
  { category: "Sales Enablement", feature: "Gestão de deals com health-score IA", ours: true, competitor: false },
  { category: "Sales Enablement", feature: "Forecast assistido por IA", ours: true, competitor: false },
  { category: "Sales Enablement", feature: "Cadências multi-touch", ours: true, competitor: false },
  { category: "Sales Enablement", feature: "Scorecards estruturados", ours: true, competitor: false },

  // WFM
  { category: "Workforce Management", feature: "Escalas e adherence em tempo real", ours: true, competitor: false },
  { category: "Workforce Management", feature: "Sugestão de troca de turnos", ours: true, competitor: false },
  { category: "Workforce Management", feature: "Forecast de volume por IA", ours: true, competitor: false },

  // Segurança
  { category: "Segurança & Compliance", feature: "LGPD nativo (DNC, retenção, auditoria)", ours: true, competitor: true },
  { category: "Segurança & Compliance", feature: "Voice biometrics anti-fraude", ours: true, competitor: false },
  { category: "Segurança & Compliance", feature: "Row-Level Security em 100% das tabelas", ours: true, competitor: false },
  { category: "Segurança & Compliance", feature: "Validação geográfica de chamadas", ours: true, competitor: false },

  // Ops
  { category: "Observabilidade", feature: "Anomaly detection e forecast de qualidade", ours: true, competitor: false },
  { category: "Observabilidade", feature: "Auto-remediation de trunks", ours: true, competitor: false },
  { category: "Observabilidade", feature: "Cockpit executivo com KPIs em tempo real", ours: true, competitor: "parcial" },

  // Integrações
  { category: "Integrações", feature: "Integração nativa Bitrix24 (bidirecional)", ours: true, competitor: false },
  { category: "Integrações", feature: "Multilíngue + tradução em tempo real", ours: true, competitor: false },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="mx-auto h-5 w-5 text-primary" />;
  if (value === false) return <X className="mx-auto h-5 w-5 text-muted-foreground/50" />;
  return <span className="text-xs font-medium text-warning">{value}</span>;
}

export default function VsThreeCPlus() {
  const categories = Array.from(new Set(rows.map((r) => r.category)));
  const ourWins = rows.filter((r) => r.ours === true && r.competitor !== true).length;

  return (
    <MarketingLayout
      title="CallCenter Pro vs. 3C Plus — Comparativo completo"
      description="Comparativo detalhado entre CallCenter Pro e 3C Plus: discador, omnichannel, inteligência de conversa, sales enablement, WFM, compliance e integrações."
    >
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="outline" className="mb-4 border-primary/40 bg-primary/5 text-primary">
          Comparativo transparente
        </Badge>
        <h1 className="text-4xl font-bold md:text-5xl">
          CallCenter Pro <span className="text-muted-foreground">vs.</span> 3C Plus
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Ambos entregam discador e omnichannel. A diferença está na profundidade da inteligência, na cobertura de sales enablement, workforce e observabilidade.
        </p>

        <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Trophy className="h-8 w-8 text-primary" />
          <div className="text-left">
            <div className="text-2xl font-bold text-primary">{ourWins} recursos exclusivos</div>
            <div className="text-xs text-muted-foreground">que a 3C Plus não oferece hoje</div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-6 py-4 text-left font-semibold">Recurso</th>
                <th className="w-40 px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-primary">CallCenter Pro</span>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Nós</Badge>
                  </div>
                </th>
                <th className="w-40 px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-muted-foreground">3C Plus</span>
                    <Badge variant="outline" className="text-[10px]">Concorrente</Badge>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <>
                  <tr key={cat} className="bg-muted/20">
                    <td colSpan={3} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat}
                    </td>
                  </tr>
                  {rows
                    .filter((r) => r.category === cat)
                    .map((r) => (
                      <tr key={r.feature} className="border-t border-border/30 hover:bg-muted/10">
                        <td className="px-6 py-3">
                          <div>{r.feature}</div>
                          {r.note && <div className="mt-0.5 text-xs text-muted-foreground">{r.note}</div>}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <Cell value={r.ours} />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <Cell value={r.competitor} />
                        </td>
                      </tr>
                    ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Comparativo baseado em informações públicas do site 3cplusnow.com em novembro/2026. Corrigimos com prazer se algo mudou — contato@callcenterpro.app.
        </p>
      </section>

      <section className="container mx-auto max-w-3xl px-4 py-12">
        <Card className="border-primary/30 p-8 text-center shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold">Migre em menos de 48 horas</h2>
          <p className="mt-3 text-muted-foreground">
            Nosso time de onboarding importa seus contatos, filas e gravações da 3C Plus sem downtime.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <Link to="/landing#demo">
                Agendar migração
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">Ver planos</Link>
            </Button>
          </div>
        </Card>
      </section>
    </MarketingLayout>
  );
}
