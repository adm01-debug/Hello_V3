import {
  Users, CheckCircle2, MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CallChannel } from '@/hooks/useMultiChannelCall';
import { channelIcons, channelColors } from './constants';

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface ChannelInfo {
  id: CallChannel;
  name: string;
  enabled: boolean;
  configured: boolean;
  description: string;
}

const statusDot = (status: string) => cn(
  "h-2 w-2 rounded-full",
  status === 'available' ? "bg-success" :
  status === 'busy' ? "bg-destructive" :
  status === 'away' ? "bg-warning" : "bg-muted-foreground"
);

interface AgentSelectorProps {
  currentAgent: Agent | null;
  agents: Agent[];
  isInCall: boolean;
  onSetAgent: (id: string) => void;
  onClearAgent: () => void;
  onSetAvailable: () => void;
  onSetAway: () => void;
}

export function AgentSelector({
  currentAgent, agents, isInCall,
  onSetAgent, onClearAgent, onSetAvailable, onSetAway,
}: AgentSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentAgent ? (
            <>
              <span className={statusDot(currentAgent.status)} />
              <span className="text-xs max-w-20 truncate">{currentAgent.name.split(' ')[0]}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Selecionar Agente</span>
          )}
          <Users className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Selecionar Agente</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {agents.map((agent) => (
          <DropdownMenuItem key={agent.id}
            onClick={() => onSetAgent(agent.id)}
            disabled={isInCall && currentAgent?.id !== agent.id}
            className="gap-2"
          >
            <span className={statusDot(agent.status)} />
            <span className="flex-1">{agent.name}</span>
            {currentAgent?.id === agent.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {currentAgent && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={onSetAvailable} disabled={isInCall} className="gap-2">
              <span className="h-2 w-2 rounded-full bg-success" /> Disponível
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSetAway} disabled={isInCall} className="gap-2">
              <span className="h-2 w-2 rounded-full bg-warning" /> Ausente
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearAgent} disabled={isInCall} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ChannelSelectorProps {
  channels: ChannelInfo[];
  activeChannel: CallChannel;
  isInCall: boolean;
  onSetChannel: (id: CallChannel) => void;
}

export function ChannelSelector({ channels, activeChannel, isInCall, onSetChannel }: ChannelSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Badge variant="secondary" className="text-xs">
            {channels.find(ch => ch.id === activeChannel)?.name}
          </Badge>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {channels.map((channel) => {
          const Icon = channelIcons[channel.id];
          return (
            <DropdownMenuItem key={channel.id}
              onClick={() => !isInCall && onSetChannel(channel.id)}
              disabled={!channel.enabled || isInCall}
              className="gap-2"
            >
              <Icon className={cn("h-4 w-4", channelColors[channel.id])} />
              <span>{channel.name}</span>
              {!channel.configured && (
                <Badge variant="outline" className="ml-auto text-xs">Config</Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
