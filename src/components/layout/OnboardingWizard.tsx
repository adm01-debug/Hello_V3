 import { useState, useEffect } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { 
   LayoutDashboard, Phone, Users, ShieldCheck, 
   ArrowRight, CheckCircle2, Bot
 } from 'lucide-react';
 import { motion, AnimatePresence } from 'framer-motion';
 
 const steps = [
   {
     title: 'Bem-vindo ao VoIP Panel 10/10',
     description: 'Sua plataforma definitiva para gestão de atendimento. Vamos fazer um tour rápido?',
     icon: Bot,
     color: 'text-primary'
   },
   {
     title: 'Painel de Controle',
     description: 'Acompanhe métricas em tempo real, volume de chamadas e status da fila em um só lugar.',
     icon: LayoutDashboard,
     color: 'text-info'
   },
   {
     title: 'Central de Chamadas',
     description: 'Realize chamadas WebRTC, SIP ou via WhatsApp com transcrição em tempo real e IA.',
     icon: Phone,
     color: 'text-success'
   },
   {
     title: 'Gestão de Contatos',
     description: 'Organize sua base de clientes com insights automáticos e histórico completo de interações.',
     icon: Users,
     color: 'text-warning'
   },
   {
     title: 'Segurança & Compliance',
     description: 'Controle de acesso granular, logs de auditoria e conformidade total com as normas do setor.',
     icon: ShieldCheck,
     color: 'text-primary'
   },
   {
     title: 'Tudo pronto!',
     description: 'Você já pode começar a usar todas as funcionalidades. Rumo à perfeição!',
     icon: CheckCircle2,
     color: 'text-success'
   }
 ];
 
 export function OnboardingWizard() {
   const [open, setOpen] = useState(false);
   const [currentStep, setCurrentStep] = useState(0);
 
   useEffect(() => {
     const hasSeenOnboarding = localStorage.getItem('voip-onboarding-seen');
     if (!hasSeenOnboarding) {
       const timer = setTimeout(() => setOpen(true), 2000);
       return () => clearTimeout(timer);
     }
   }, []);
 
   const handleNext = () => {
     if (currentStep < steps.length - 1) {
       setCurrentStep(prev => prev + 1);
     } else {
       handleClose();
     }
   };
 
   const handleClose = () => {
     setOpen(false);
     localStorage.setItem('voip-onboarding-seen', 'true');
   };
 
   const step = steps[currentStep];
   const Icon = step.icon;
 
   return (
     <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
       <DialogContent className="sm:max-w-md glass-neon border-primary/20">
         <div className="flex flex-col items-center py-6">
           <AnimatePresence mode="wait">
             <motion.div
               key={currentStep}
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.8, opacity: 0 }}
               transition={{ type: 'spring', damping: 20, stiffness: 300 }}
               className={`p-4 rounded-full bg-primary/10 mb-4`}
             >
               <Icon className={`h-12 w-12 ${step.color}`} />
             </motion.div>
           </AnimatePresence>
 
           <DialogHeader className="text-center">
             <DialogTitle className="text-2xl font-bold text-gradient">
               {step.title}
             </DialogTitle>
             <DialogDescription className="text-base text-center mt-2">
               {step.description}
             </DialogDescription>
           </DialogHeader>
 
           <div className="flex gap-1 mt-6">
             {steps.map((_, i) => (
               <div 
                 key={i} 
                 className={`h-1 rounded-full transition-all duration-300 ${
                   i === currentStep ? 'w-8 bg-primary shadow-[0_0_8px_hsl(var(--primary))]' : 'w-2 bg-muted'
                 }`}
               />
             ))}
           </div>
         </div>
 
         <DialogFooter className="flex-row sm:justify-between items-center border-t border-border/30 pt-4">
           <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
             Pular tour
           </Button>
           <Button onClick={handleNext} className="gap-2 glow-primary">
             {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
             <ArrowRight className="h-4 w-4" />
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }