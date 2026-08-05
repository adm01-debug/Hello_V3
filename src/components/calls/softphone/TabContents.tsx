import { Phone, History, PhoneIncoming, PhoneOutgoing, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CallSession, CallChannel } from '@/hooks/useMultiChannelCall';
import { channelIcons, formatCallDuration, getInitials } from './constants';

interface ContactsTabProps {
  quickContacts: Array<{ id: string; name: string; phone: string; favorite: boolean; company?: string }>;
  isInCall: boolean;
  activeChannel: CallChannel;
  onSelectContact: (phone: string, name: string) => void;
}

export function ContactsTab({ quickContacts, isInCall, activeChannel, onSelectContact }: ContactsTabProps) {
  return (
    <ScrollArea className="h-[300px]">
      <div className="grid grid-cols-2 gap-2">
        {quickContacts.map((contact) => (
          <Button
            key={contact.id}
            variant="outline"
            className="h-auto flex-col gap-1 p-3"
            onClick={() => onSelectContact(contact.phone.replace(/\D/g, ''), contact.name)}
            disabled={isInCall || activeChannel === 'webrtc'}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {getInitials(contact.name)}
            </div>
            <span className="text-xs font-medium truncate w-full">{contact.name}</span>
            <span className="text-[10px] text-muted-foreground truncate w-full">{contact.company ?? ''}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

interface HistoryTabProps {
  callHistory: CallSession[];
  onSelectNumber: (phone: string) => void;
}

export function HistoryTab({ callHistory, onSelectNumber }: HistoryTabProps) {
  if (callHistory.length === 0) {
    return (
      <ScrollArea className="h-[300px]">
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma chamada recente</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {callHistory.map((call) => {
          const CallIcon = channelIcons[call.channel];
          return (
            <div
              key={call.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
              onClick={() => call.phoneNumber && onSelectNumber(call.phoneNumber)}
            >
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center",
                call.direction === 'inbound' ? "bg-info/10" : "bg-success/10"
              )}>
                {call.direction === 'inbound'
                  ? <PhoneIncoming className="h-4 w-4 text-info" />
                  : <PhoneOutgoing className="h-4 w-4 text-success" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {call.contactName || call.phoneNumber || 'Chamada'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CallIcon className="h-3 w-3" />
                  {formatCallDuration(call.duration)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
