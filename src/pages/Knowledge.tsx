import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, FileText, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useKbCategories, useKbArticles, useKbArticle, useUpsertArticle, useRecordKbView, type KbArticle } from '@/hooks/useKnowledgeBase';
import { useAuthContext } from '@/contexts/AuthContext';

import { ptBR } from 'date-fns/locale';

import { safeFormatDistanceToNow } from "@/lib/safe-date";
export default function Knowledge() {
  usePageTitle('Knowledge Base');
  const { profile } = useAuthContext();
  const isEditor = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [editing, setEditing] = useState<Partial<KbArticle> | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: categories = [] } = useKbCategories();
  const { data: articles = [], isLoading } = useKbArticles({
    search: search || undefined,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    status: isEditor ? undefined : 'published',
  });

  const upsert = useUpsertArticle();
  // Detalhe do artigo: a lista só trazia o excerpt, então nem agente nem editor liam o conteúdo.
  const articleQuery = useKbArticle(viewingId);
  const recordView = useRecordKbView();
  const [viewLoggedFor, setViewLoggedFor] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // A leitura do artigo nunca era contada: o contador ficava zerado para sempre.
  useEffect(() => {
    if (!viewingId || viewLoggedFor === viewingId || !articleQuery.data) return;
    setViewLoggedFor(viewingId);
    setFeedbackGiven(false);
    recordView.mutate({ articleId: viewingId });
  }, [viewingId, viewLoggedFor, articleQuery.data, recordView]);

  const handleFeedback = (wasHelpful: boolean) => {
    if (!viewingId || feedbackGiven) return;
    setFeedbackGiven(true);
    recordView.mutate({ articleId: viewingId, wasHelpful });
  };

  const handleSave = () => {
    if (!editing?.title || !editing?.content) return;
    const slug = editing.slug || editing.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 80);
    upsert.mutate(
      {
        ...editing,
        title: editing.title,
        slug,
        content: editing.content,
        status: editing.status || 'draft',
        category_id: editing.category_id || null,
        tags: editing.tags || [],
        author_email: profile?.email || null,
      },
      {
        onSuccess: () => setEditing(null),
      }
    );
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Knowledge Base"
        description="Base de conhecimento interna com busca semântica em português"
        icon={<BookOpen />}
        actions={
          isEditor && (
            <Button onClick={() => setEditing({ status: 'draft' })} className="gap-2">
              <Plus className="h-4 w-4" /> Novo artigo
            </Button>
          )
        }
      />

       <Card variant="neon" className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full md:w-60 bg-background/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState icon={<FileText />} title="Nenhum artigo" description="Crie o primeiro artigo da sua base." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {articles.map((a) => (
             <Card
               key={a.id}
               variant="neon-interactive"
               className="p-4"
               onClick={() => (isEditor ? setEditing(a) : setViewingId(a.id))}
             >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold line-clamp-2">{a.title}</h3>
                <Badge variant={a.status === 'published' ? 'default' : 'outline'} className="text-[10px] shrink-0">
                  {a.status}
                </Badge>
              </div>
              {a.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{a.excerpt}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {a.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {a.helpful_count}
                  </span>
                </div>
                <span>{safeFormatDistanceToNow(a.updated_at, { locale: ptBR, addSuffix: true })}</span>
              </div>
              {a.tags && a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {a.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] h-4 px-1.5">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start gap-1 text-xs"
                aria-label={`Ler artigo ${a.title}`}
                onClick={(e) => { e.stopPropagation(); setViewingId(a.id); }}
              >
                <Eye className="h-3 w-3" /> Ler artigo
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar artigo' : 'Novo artigo'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-2">
              <Input
                placeholder="Título do artigo"
                value={editing?.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
              <Input
                placeholder="Resumo (opcional)"
                value={editing?.excerpt || ''}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              />
              <Textarea
                placeholder="Conteúdo (markdown)..."
                value={editing?.content || ''}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                className="min-h-[300px] font-mono text-sm"
              />
              <Input
                placeholder="Tags separadas por vírgula"
                value={(editing?.tags || []).join(', ')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={editing?.category_id || ''}
                  onValueChange={(v) => setEditing({ ...editing, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editing?.status || 'draft'}
                  onValueChange={(v) => setEditing({ ...editing, status: v as KbArticle['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingId} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{articleQuery.data?.title ?? 'Artigo da base'}</DialogTitle>
            <DialogDescription>
              {articleQuery.data?.excerpt ?? 'Leitura do artigo selecionado na base de conhecimento.'}
            </DialogDescription>
          </DialogHeader>

          {articleQuery.isLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Carregando artigo">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : articleQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">Não foi possível carregar o artigo.</p>
              <Button variant="outline" size="sm" onClick={() => void articleQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          ) : !articleQuery.data ? (
            <EmptyState
              icon={<FileText />}
              title="Artigo não encontrado"
              description="Ele pode ter sido removido ou arquivado."
            />
          ) : (
            <>
              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={articleQuery.data.status === 'published' ? 'default' : 'outline'} className="text-[10px]">
                      {articleQuery.data.status}
                    </Badge>
                    {articleQuery.data.tags?.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] h-4 px-1.5">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{articleQuery.data.content}</p>
                </div>
              </ScrollArea>
              <DialogFooter className="sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Foi útil?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Marcar artigo como útil"
                    disabled={feedbackGiven}
                    onClick={() => handleFeedback(true)}
                    className="gap-1"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> Sim
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Marcar artigo como não útil"
                    disabled={feedbackGiven}
                    onClick={() => handleFeedback(false)}
                    className="gap-1"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" /> Não
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setViewingId(null)}>
                    Fechar
                  </Button>
                  {isEditor && (
                    <Button
                      onClick={() => {
                        const article = articleQuery.data;
                        if (!article) return;
                        setViewingId(null);
                        setEditing(article);
                      }}
                    >
                      Editar artigo
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </NeonPageLayout>
  );
}
