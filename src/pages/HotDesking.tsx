import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Monitor, MapPin, Phone, User, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export default function HotDesking() {
  const queryClient = useQueryClient();
  const { profile } = useAuthContext();

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['hot-desking'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hot_desking_stations').select('*').order('station_name');
      if (error) throw error;
      return data || [];
    },
  });

  const checkIn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hot_desking_stations').update({
        is_available: false,
        current_user_name: profile?.full_name || profile?.email || 'Agente',
        checked_in_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-desking'] });
      toast.success('Check-in realizado!');
    },
  });

  const checkOut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hot_desking_stations').update({
        is_available: true,
        current_user_name: null,
        checked_in_at: null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-desking'] });
      toast.success('Check-out realizado!');
    },
  });

  const available = stations.filter((s) => s.is_available).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Monitor className="h-8 w-8 text-primary" />
          Hot Desking
        </h1>
        <p className="text-muted-foreground">Login temporário em estações de trabalho</p>
        <Badge variant="outline" className="mt-2">⚠️ Aguardando integração com infraestrutura física</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Monitor className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{stations.length}</p><p className="text-xs text-muted-foreground">Estações</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-success" /></div>
          <div><p className="text-2xl font-bold">{available}</p><p className="text-xs text-muted-foreground">Disponíveis</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><User className="h-5 w-5 text-warning" /></div>
          <div><p className="text-2xl font-bold">{stations.length - available}</p><p className="text-xs text-muted-foreground">Em Uso</p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma estação configurada</p>
          </Card>
        ) : stations.map((station) => (
          <Card key={station.id} className={`transition-all hover:shadow-md ${station.is_available ? 'border-success/30' : 'border-amber-500/30'}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{station.station_name}</p>
                <Badge variant={station.is_available ? 'default' : 'secondary'}>
                  {station.is_available ? 'Disponível' : 'Em Uso'}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {station.location && <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {station.location}</p>}
                {station.extension && <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> Ramal {station.extension}</p>}
                {station.current_user_name && <p className="flex items-center gap-2"><User className="h-3 w-3" /> {station.current_user_name}</p>}
              </div>
              {station.is_available ? (
                <Button size="sm" className="w-full gap-2" onClick={() => checkIn.mutate(station.id)}>
                  <LogIn className="h-4 w-4" /> Check-in
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => checkOut.mutate(station.id)}>
                  <LogOut className="h-4 w-4" /> Check-out
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
