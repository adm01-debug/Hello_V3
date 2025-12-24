import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Check, 
  Volume2, 
  VolumeX,
  Zap,
  Bell,
  Save
} from 'lucide-react';
import { AlertSoundConfig } from './AlertSoundSettings';
import { toast } from 'sonner';

export interface SoundProfile {
  id: string;
  name: string;
  icon: 'silent' | 'normal' | 'urgent' | 'custom';
  config: AlertSoundConfig;
  isDefault?: boolean;
}

const DEFAULT_PROFILES: SoundProfile[] = [
  {
    id: 'silent',
    name: 'Silencioso',
    icon: 'silent',
    config: {
      warningFrequency: 440,
      warningPattern: 'single',
      warningVolume: 0,
      criticalFrequency: 660,
      criticalPattern: 'single',
      criticalVolume: 0.1,
    },
    isDefault: true,
  },
  {
    id: 'normal',
    name: 'Normal',
    icon: 'normal',
    config: {
      warningFrequency: 520,
      warningPattern: 'single',
      warningVolume: 0.2,
      criticalFrequency: 880,
      criticalPattern: 'urgent',
      criticalVolume: 0.3,
    },
    isDefault: true,
  },
  {
    id: 'urgent',
    name: 'Urgente',
    icon: 'urgent',
    config: {
      warningFrequency: 660,
      warningPattern: 'double',
      warningVolume: 0.4,
      criticalFrequency: 1000,
      criticalPattern: 'urgent',
      criticalVolume: 0.6,
    },
    isDefault: true,
  },
];

const STORAGE_KEY = 'supervisor-sound-profiles';
const ACTIVE_PROFILE_KEY = 'supervisor-active-profile';

interface SoundProfileManagerProps {
  currentConfig: AlertSoundConfig;
  onApplyProfile: (config: AlertSoundConfig) => void;
}

export const SoundProfileManager = ({ currentConfig, onApplyProfile }: SoundProfileManagerProps) => {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [profiles, setProfiles] = useState<SoundProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileIcon, setNewProfileIcon] = useState<'silent' | 'normal' | 'urgent' | 'custom'>('custom');

  useEffect(() => {
    // Load profiles from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedProfiles = JSON.parse(saved);
        setProfiles([...DEFAULT_PROFILES, ...parsedProfiles]);
      } catch {
        setProfiles(DEFAULT_PROFILES);
      }
    } else {
      setProfiles(DEFAULT_PROFILES);
    }

    // Load active profile
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeId) {
      setActiveProfileId(activeId);
    }
  }, []);

  const saveProfiles = (updatedProfiles: SoundProfile[]) => {
    const customProfiles = updatedProfiles.filter(p => !p.isDefault);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customProfiles));
    setProfiles([...DEFAULT_PROFILES, ...customProfiles]);
  };

  const handleApplyProfile = (profile: SoundProfile) => {
    onApplyProfile(profile.config);
    setActiveProfileId(profile.id);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    toast.success(`Perfil "${profile.name}" aplicado`);
    setOpen(false);
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      toast.error('Digite um nome para o perfil');
      return;
    }

    const newProfile: SoundProfile = {
      id: `custom-${Date.now()}`,
      name: newProfileName.trim(),
      icon: newProfileIcon,
      config: { ...currentConfig },
    };

    const customProfiles = profiles.filter(p => !p.isDefault);
    saveProfiles([...customProfiles, newProfile]);
    
    setNewProfileName('');
    setNewProfileIcon('custom');
    setCreateDialogOpen(false);
    toast.success(`Perfil "${newProfile.name}" criado`);
  };

  const handleDeleteProfile = (profileId: string) => {
    const customProfiles = profiles.filter(p => !p.isDefault && p.id !== profileId);
    saveProfiles(customProfiles);
    
    if (activeProfileId === profileId) {
      setActiveProfileId(null);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
    
    toast.success('Perfil removido');
  };

  const getProfileIcon = (icon: string) => {
    switch (icon) {
      case 'silent':
        return <VolumeX className="h-5 w-5" />;
      case 'urgent':
        return <Zap className="h-5 w-5" />;
      case 'normal':
        return <Volume2 className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getProfileColor = (icon: string) => {
    switch (icon) {
      case 'silent':
        return 'bg-muted text-muted-foreground';
      case 'urgent':
        return 'bg-destructive/20 text-destructive';
      case 'normal':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-accent/20 text-accent-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FolderOpen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Perfis de Som
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {profiles.map((profile) => (
              <Card 
                key={profile.id} 
                className={`cursor-pointer transition-all hover:border-primary ${
                  activeProfileId === profile.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleApplyProfile(profile)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getProfileColor(profile.icon)}`}>
                        {getProfileIcon(profile.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{profile.name}</span>
                          {profile.isDefault && (
                            <Badge variant="outline" className="text-xs">Padrão</Badge>
                          )}
                          {activeProfileId === profile.id && (
                            <Badge variant="default" className="text-xs bg-success">
                              <Check className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Warning: {Math.round(profile.config.warningVolume * 100)}% | 
                          Critical: {Math.round(profile.config.criticalVolume * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    {!profile.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Criar Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Perfil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Perfil</Label>
                  <Input
                    placeholder="Ex: Reunião, Noturno..."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={newProfileIcon} onValueChange={(v) => setNewProfileIcon(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silent">
                        <div className="flex items-center gap-2">
                          <VolumeX className="h-4 w-4" />
                          Silencioso
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          Normal
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Urgente
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Personalizado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  O perfil será criado com as configurações de som atuais.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Perfil
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
