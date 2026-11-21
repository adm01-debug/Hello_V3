import { useState } from 'react';
import { useCallPlaylists, usePlaylistItems } from '@/hooks/useCallPlaylists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ListMusic, Plus } from 'lucide-react';
import { safeToLocaleDateString } from '@/lib/safe-date';

export function CallPlaylistsPanel() {
  const { playlists, loading, createPlaylist, addItem } = useCallPlaylists();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [callId, setCallId] = useState('');
  const { items } = usePlaylistItems(selected ?? undefined);

  const handleCreate = () => {
    if (!name.trim()) return;
    createPlaylist({ name: name.trim() });
    setName('');
  };

  if (loading) {
    return <div className="space-y-2"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListMusic className="h-4 w-4" />Minhas Playlists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input placeholder="Nome da playlist" value={name} onChange={(e) => setName(e.target.value)} />
              <Button size="sm" disabled={!name.trim()} onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" />Criar
              </Button>
            </div>
            {playlists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma playlist criada.</p>
            ) : (
              playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(selected === p.id ? null : p.id)}
                  className="w-full text-left p-3 rounded-lg border hover:border-primary/50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.playlist_type} · criada em {safeToLocaleDateString(p.created_at)}
                    </p>
                  </div>
                  {p.playlist_type === 'auto' && <Badge variant="secondary">Automática</Badge>}
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Itens da Playlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selected ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Selecione uma playlist à esquerda.</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Playlist vazia.</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="p-3 rounded-lg border">
                <p className="text-sm font-medium">ID de chamada: {it.call_session_id}</p>
                {it.notes && <p className="text-xs text-muted-foreground mt-1">{it.notes}</p>}
              </div>
            ))
          )}
          {selected && (
            <div className="flex gap-2 pt-2 border-t">
              <Input placeholder="ID da call (call_session_id)" value={callId} onChange={(e) => setCallId(e.target.value)} />
              <Button size="sm" disabled={!callId.trim()} onClick={() => { addItem(selected, callId.trim()); setCallId(''); }}>
                Adicionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}