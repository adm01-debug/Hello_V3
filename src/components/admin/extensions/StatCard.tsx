import { Card, CardContent } from '@/components/ui/card';

type Tone = 'primary' | 'success' | 'warning' | 'muted' | 'destructive';

export interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  tone: Tone;
}

const TONE_CLS: Record<Tone, string> = {
  primary: 'text-primary border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.15)]',
  success: 'text-success border-success/30 shadow-[0_0_15px_hsl(var(--success)/0.15)]',
  warning: 'text-warning border-warning/30 shadow-[0_0_15px_hsl(var(--warning)/0.15)]',
  destructive: 'text-destructive border-destructive/30 shadow-[0_0_15px_hsl(var(--destructive)/0.15)]',
  muted: 'text-muted-foreground border-border',
};

export function StatCard({ icon: Icon, label, value, tone, suffix }: StatCardProps) {
  return (
    <Card className={`${TONE_CLS[tone]} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
            <p className="text-3xl font-bold mt-1 text-display">
              {value}
              {suffix && <span className="text-lg opacity-60">{suffix}</span>}
            </p>
          </div>
          <Icon className="h-8 w-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
}
