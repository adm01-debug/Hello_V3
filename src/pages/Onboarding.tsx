import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  CheckCircle2,
  Circle,
  Server,
  Users,
  Radio,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  cta: string;
  href: string;
  estimated: string;
}

const STEPS: Step[] = [
  {
    key: "trunk",
    title: "Configurar trunk SIP",
    description:
      "Cadastre credenciais do seu provedor VoIP. Suportamos qualquer operador SIP/WebRTC brasileiro.",
    icon: Server,
    cta: "Ir para trunks",
    href: "/admin/extensions",
    estimated: "10 min",
  },
  {
    key: "ramais",
    title: "Cadastrar ramais e agentes",
    description:
      "Crie ramais, associe a agentes e defina permissões. LDAP disponível para importação em lote.",
    icon: Users,
    cta: "Gerenciar ramais",
    href: "/admin/extensions",
    estimated: "15 min",
  },
  {
    key: "fila",
    title: "Montar fila e roteamento",
    description:
      "Defina fila de atendimento, regras de distribuição, horários e áudio de espera.",
    icon: Radio,
    cta: "Configurar filas",
    href: "/routing-rules",
    estimated: "10 min",
  },
  {
    key: "teste",
    title: "Testar chamada real",
    description:
      "Faça uma ligação de teste pelo softphone integrado. Se o áudio bidirecional funcionar, você está no ar.",
    icon: PhoneCall,
    cta: "Abrir softphone",
    href: "/calls",
    estimated: "5 min",
  },
];

export default function Onboarding() {
  usePageTitle("Onboarding rápido");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);

  const toggle = (key: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const total = STEPS.length;
  const done = completed.size;
  const progress = Math.round((done / total) * 100);
  const step = STEPS[current];
  const Icon = step.icon;
  const isDone = completed.has(step.key);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <Badge variant="secondary" className="mb-3 gap-1">
          <Sparkles className="h-3.5 w-3.5" /> Setup guiado
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Coloque sua operação no ar em menos de 1 hora</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          4 passos objetivos. Marque cada etapa conforme conclui — pode voltar quando quiser.
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            {done} de {total} concluído{done === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, idx) => {
          const isCompleted = completed.has(s.key);
          const isActive = idx === current;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`rounded-lg border p-2 text-left text-xs transition-all ${
                isActive
                  ? "border-primary bg-primary/5"
                  : isCompleted
                    ? "border-success/40 bg-success/5"
                    : "border-border hover:border-primary/40"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="font-semibold">Passo {idx + 1}</span>
              </div>
              <span className="text-muted-foreground">{s.title}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <p className="text-xs text-muted-foreground">Estimativa: {step.estimated}</p>
            </div>
            {isDone && (
              <Badge className="gap-1 bg-success text-success-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{step.description}</p>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={step.href}>
                {step.cta} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant={isDone ? "outline" : "secondary"} onClick={() => toggle(step.key)}>
              {isDone ? "Desmarcar" : "Marcar como concluído"}
            </Button>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <Button
              variant="ghost"
              disabled={current === total - 1}
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            >
              Próximo <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {done === total && (
        <Card className="mt-6 border-success/40 bg-success/5">
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div className="flex-1">
              <p className="font-semibold">Operação pronta!</p>
              <p className="text-sm text-muted-foreground">
                Todos os passos concluídos. Bem-vindo à CallCenter Pro.
              </p>
            </div>
            <Button asChild>
              <Link to="/">Ir ao dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
