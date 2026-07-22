import { MarketingLayout } from "./marketing/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Building2,
  PhoneCall,
  Users,
  Radio,
  Bot,
  Mic,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Integration {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  status: "disponivel" | "beta" | "roadmap";
  featured?: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    slug: "bitrix24",
    name: "Bitrix24",
    category: "CRM",
    description: "Sincronização bidirecional de contatos, deals e histórico de chamadas em tempo real.",
    icon: Building2,
    status: "disponivel",
    featured: true,
  },
  {
    slug: "whatsapp",
    name: "WhatsApp Business",
    category: "Omnichannel",
    description: "Voz via Wavoip e mensagens templated. IA reescreve rascunhos e sugere respostas.",
    icon: MessageSquare,
    status: "disponivel",
    featured: true,
  },
  {
    slug: "sip-generico",
    name: "SIP genérico",
    category: "VoIP",
    description: "Compatível com Asterisk, FreeSWITCH, 3CX e qualquer PBX que exponha SIP/WebRTC.",
    icon: PhoneCall,
    status: "disponivel",
  },
  {
    slug: "ldap",
    name: "LDAP / Active Directory",
    category: "Identidade",
    description: "Importação e sincronização automática de ramais, grupos e permissões.",
    icon: Users,
    status: "disponivel",
  },
  {
    slug: "wavoip",
    name: "Wavoip",
    category: "VoIP",
    description: "Chamadas de voz nativas por WhatsApp — sem migração de número.",
    icon: Radio,
    status: "disponivel",
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    category: "IA de Voz",
    description: "Agentes conversacionais em PT-BR com transcrição, sentimento e resumo automáticos.",
    icon: Mic,
    status: "beta",
  },
  {
    slug: "gemini",
    name: "Google Gemini",
    category: "IA",
    description: "Sumário de chamadas, coaching e reescrita de mensagens via Lovable AI Gateway.",
    icon: Bot,
    status: "disponivel",
  },
  {
    slug: "data-lake",
    name: "Data Lake (BigQuery / Snowflake)",
    category: "Analytics",
    description: "Export incremental de chamadas, métricas e transcrições para o seu warehouse.",
    icon: BarChart3,
    status: "roadmap",
  },
];

const STATUS_STYLES: Record<Integration["status"], string> = {
  disponivel: "bg-success/15 text-success border-success/30",
  beta: "bg-warning/15 text-warning border-warning/30",
  roadmap: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<Integration["status"], string> = {
  disponivel: "Disponível",
  beta: "Beta",
  roadmap: "Roadmap",
};

export default function Marketplace() {
  const categorias = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

  return (
    <MarketingLayout
      title="Marketplace de integrações — CallCenter Pro"
      description="CRMs, canais, IA, identidade e analytics — todas as integrações nativas da CallCenter Pro."
    >
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">
              Integrações nativas
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Conecte o que você já usa em minutos
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Zero código para começar. APIs abertas e webhooks para o que precisar de extensão.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {categorias.map((c) => (
              <Badge key={c} variant="outline" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card
                  key={integration.slug}
                  className="border-border/60 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[integration.status]}>
                      {STATUS_LABEL[integration.status]}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-1 text-lg">{integration.name}</CardTitle>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {integration.category}
                    </p>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 rounded-xl border border-border/60 bg-muted/20 p-8 text-center">
            <h2 className="text-xl font-semibold">Sua integração não está na lista?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Webhooks, REST e edge functions abertas. Fale com a equipe — 80% das integrações
              solicitadas entram no roadmap em até 30 dias.
            </p>
            <Button asChild className="mt-4">
              <Link to="/landing#demo">
                Falar com especialista <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
