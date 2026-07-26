import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Music, Play, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueueAudioPrompts } from '@/hooks/useQueueAudioPrompts';
import {
  AUDIO_PROMPT_KINDS,
  AUDIO_PROMPT_KIND_LABELS,
  formatBytes,
  formatDuration,
  validateAudioFile,
  type AudioPromptKind,
} from '@/lib/queue-audio';

/**
 * Lê a duração do arquivo no navegador. Falhas (codec exótico, metadata
 * indisponível) retornam 0 — a duração é informativa, nunca bloqueia o upload.
 */
async function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      const finish = (value: number) => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(value) ? Math.round(value) : 0);
      };
      audio.addEventListener('loadedmetadata', () => finish(audio.duration));
      audio.addEventListener('error', () => finish(0));
      window.setTimeout(() => finish(0), 5000);
      audio.src = url;
    } catch {
      resolve(0);
    }
  });
}

export interface QueueAudioLibraryProps {
  className?: string;
  canManage: boolean;
}

export function QueueAudioLibrary({ className, canManage }: QueueAudioLibraryProps) {
  const { prompts, isLoading, uploadPrompt, updatePrompt, deletePrompt, getPreviewUrl } =
    useQueueAudioPrompts();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<AudioPromptKind>('moh');
  const [errors, setErrors] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return AUDIO_PROMPT_KINDS.map((entry) => ({
      kind: entry,
      items: prompts.filter((prompt) => prompt.kind === entry),
    })).filter((group) => group.items.length > 0);
  }, [prompts]);

  const handleFile = (selected: File | null) => {
    setFile(selected);
    setErrors(selected ? validateAudioFile(selected) : []);
    if (selected && name.trim().length === 0) {
      setName(selected.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 120));
    }
  };

  const handleUpload = async () => {
    const found = file ? validateAudioFile(file) : ['Selecione um arquivo de áudio.'];
    if (name.trim().length === 0) found.push('Informe um nome para o áudio.');
    setErrors(found);
    if (found.length > 0 || !file) return;

    const durationSeconds = await readAudioDuration(file);
    await uploadPrompt.mutateAsync({
      file,
      name: name.trim(),
      description: description.trim() || null,
      kind,
      durationSeconds,
    });

    setFile(null);
    setName('');
    setDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreview = useCallback(
    async (id: string, storagePath: string) => {
      if (previewId === id) {
        setPreviewId(null);
        setPreviewUrl(null);
        return;
      }
      const url = await getPreviewUrl(storagePath);
      setPreviewId(url ? id : null);
      setPreviewUrl(url);
    },
    [getPreviewUrl, previewId],
  );

  return (
    <Card className={cn('border-border', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="h-5 w-5 text-primary" aria-hidden="true" />
          Biblioteca de áudios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManage && (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="audio-file">Arquivo (MP3, WAV, OGG, AAC — até 20 MB)</Label>
                <Input
                  id="audio-file"
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio-name">Nome</Label>
                <Input
                  id="audio-name"
                  value={name}
                  maxLength={120}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Jazz suave 3 min"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio-kind">Tipo</Label>
                <Select value={kind} onValueChange={(value) => setKind(value as AudioPromptKind)}>
                  <SelectTrigger id="audio-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIO_PROMPT_KINDS.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {AUDIO_PROMPT_KIND_LABELS[entry]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="audio-description">Descrição (opcional)</Label>
                <Textarea
                  id="audio-description"
                  rows={2}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleUpload} disabled={uploadPrompt.isPending}>
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              {uploadPrompt.isPending ? 'Enviando…' : 'Enviar áudio'}
            </Button>
          </div>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Carregando áudios…</p>}

        {!isLoading && prompts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum áudio cadastrado. Envie faixas de música em espera e anúncios para usá-las nas
            filas.
          </p>
        )}

        {grouped.map((group) => (
          <div key={group.kind} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {AUDIO_PROMPT_KIND_LABELS[group.kind]}
            </h3>
            <ul className="space-y-2">
              {group.items.map((prompt) => (
                <li
                  key={prompt.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{prompt.name}</span>
                      {!prompt.is_active && <Badge variant="outline">Inativo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(prompt.duration_seconds)} ·{' '}
                      {formatBytes(prompt.file_size_bytes)}
                      {prompt.description ? ` · ${prompt.description}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handlePreview(prompt.id, prompt.storage_path)}
                      aria-label={`Pré-escutar ${prompt.name}`}
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    {canManage && (
                      <>
                        <Switch
                          checked={prompt.is_active}
                          aria-label={`Ativar ${prompt.name}`}
                          onCheckedChange={(checked) =>
                            updatePrompt.mutate({ id: prompt.id, changes: { is_active: checked } })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePrompt.mutate(prompt)}
                          aria-label={`Remover ${prompt.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>

                  {previewId === prompt.id && previewUrl && (
                    <audio className="w-full sm:w-64" controls autoPlay src={previewUrl}>
                      <track kind="captions" />
                    </audio>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
