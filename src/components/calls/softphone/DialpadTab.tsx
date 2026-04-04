import {
  Phone, Delete, Waves, MessageCircle, Settings, Loader2,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CallChannel, CallSession } from '@/hooks/useMultiChannelCall';
import { dialPadButtons } from './constants';

interface DialpadTabProps {
  activeChannel: CallChannel;
  phoneNumber: string;
  isInCall: boolean;
  canAddCall: boolean;
  activeCalls: CallSession[];
  wavoipConfigured: boolean;
  wavoipStatus: string;
  wavoipError: string | null;
  onPhoneChange: (v: string) => void;
  onDigitPress: (d: string) => void;
  onBackspace: () => void;
  onStartCall: () => void;
  onCheckWavoip: () => void;
}

export function DialpadTab({
  activeChannel, phoneNumber, isInCall, canAddCall, activeCalls,
  wavoipConfigured, wavoipStatus, wavoipError,
  onPhoneChange, onDigitPress, onBackspace, onStartCall, onCheckWavoip,
}: DialpadTabProps) {
  return (
    <div className="space-y-4">
      {/* Number display */}
      <div className="relative">
        <Input
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={activeChannel === 'webrtc' ? 'Chamada IA' : 'Digite o número'}
          className="h-12 text-center text-xl font-mono tracking-wider pr-10"
          disabled={activeChannel === 'webrtc'}
        />
        {phoneNumber && (
          <Button variant="ghost" size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={onBackspace}
          >
            <Delete className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dialpad */}
      {activeChannel !== 'webrtc' && (
        <div className="grid grid-cols-3 gap-2">
          {dialPadButtons.map(({ digit, letters }) => (
            <Button key={digit} variant="outline"
              className="h-14 flex-col gap-0 text-lg font-medium"
              onClick={() => onDigitPress(digit)} disabled={isInCall}
            >
              <span>{digit}</span>
              {letters && <span className="text-[9px] text-muted-foreground">{letters}</span>}
            </Button>
          ))}
        </div>
      )}

      {/* WebRTC info */}
      {activeChannel === 'webrtc' && !isInCall && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Waves className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">Chamada com Agente IA</p>
              <p className="text-xs text-muted-foreground">Converse naturalmente com o agente de voz</p>
            </div>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pl-4">
            <li>• Transcrição em tempo real</li>
            <li>• Sem necessidade de número</li>
            <li>• IA conversacional avançada</li>
          </ul>
        </div>
      )}

      {/* Wavoip status */}
      {activeChannel === 'wavoip' && !isInCall && (
        <div className={cn(
          "p-4 rounded-lg border text-center",
          wavoipConfigured ? "border-success/30 bg-success/5" : "border-dashed border-warning/50 bg-warning/5"
        )}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className={cn("h-8 w-8", wavoipConfigured ? "text-success" : "text-warning")} />
            {wavoipConfigured
              ? <CheckCircle2 className="h-5 w-5 text-success" />
              : <XCircle className="h-5 w-5 text-warning" />}
          </div>
          <p className={cn("font-medium", wavoipConfigured ? "text-success" : "text-warning")}>
            {wavoipConfigured ? 'WhatsApp Conectado' : 'WhatsApp Calls'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {wavoipConfigured ? 'Pronto para fazer chamadas de voz via WhatsApp' : 'Configure o token Wavoip nas configurações'}
          </p>
          {wavoipConfigured && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success">Online</span>
            </div>
          )}
          {wavoipError && !wavoipConfigured && (
            <p className="text-xs text-destructive mt-2">{wavoipError}</p>
          )}
          {!wavoipConfigured && (
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onCheckWavoip}>
              <Settings className="h-3 w-3" /> Verificar Conexão
            </Button>
          )}
        </div>
      )}

      {/* Call button */}
      {(!isInCall || canAddCall) && (
        <Button
          className={cn(
            "w-full h-14 gap-2 text-lg",
            activeChannel === 'wavoip' && wavoipConfigured && "bg-success hover:bg-success/90"
          )}
          onClick={onStartCall}
          disabled={
            (activeChannel !== 'webrtc' && !phoneNumber) ||
            (activeChannel === 'wavoip' && !wavoipConfigured) ||
            !canAddCall
          }
        >
          {wavoipStatus === 'connecting' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : activeChannel === 'wavoip' ? (
            <MessageCircle className="h-5 w-5" />
          ) : (
            <Phone className="h-5 w-5" />
          )}
          {isInCall ? (
            <>Nova Chamada ({activeCalls.length}/3)</>
          ) : (
            activeChannel === 'webrtc' ? 'Iniciar Chamada IA'
            : activeChannel === 'wavoip' ? 'Ligar via WhatsApp'
            : 'Ligar'
          )}
        </Button>
      )}
    </div>
  );
}
