import { Phone, Headphones, BarChart3, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginBranding() {
  return (
    <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(232,35%,5%)]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[hsl(280,80%,60%)]/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[hsl(350,90%,55%)]/5 blur-[80px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(185 100% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 flex flex-col justify-between w-full p-12"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 shadow-[0_0_25px_hsl(185_100%_50%/0.2)]">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white text-display tracking-wider">CallCenter Pro</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-primary/60">Enterprise Suite</p>
          </div>
        </div>

        <div className="space-y-8 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight text-display">
              Gerencie seu call center com{' '}
              <span className="text-gradient">inteligência</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed">
              Monitore chamadas em tempo real, otimize a performance dos agentes e tome decisões baseadas em dados.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Headphones, label: 'Monitoramento em tempo real', desc: 'Acompanhe todas as chamadas ativas', delay: 0.2 },
              { icon: BarChart3, label: 'Analytics avançados', desc: 'Relatórios e métricas detalhadas', delay: 0.3 },
              { icon: Users, label: 'Gestão de equipe', desc: 'Coaching e gamificação de agentes', delay: 0.4 },
            ].map(({ icon: Icon, label, desc, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:border-primary/20 hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:shadow-[0_0_15px_hsl(185_100%_50%/0.2)] transition-shadow duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/30">
          <Shield className="h-3 w-3" />
          <span>Criptografia end-to-end · SOC 2 Compliant</span>
        </div>
      </motion.div>
    </div>
  );
}
