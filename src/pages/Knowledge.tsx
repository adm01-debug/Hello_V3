import { useState } from 'react';
import { BookOpen, Plus, Search, FileText, Eye, ThumbsUp } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useKbCategories, useKbArticles, useUpsertArticle, type KbArticle } from '@/hooks/useKnowledgeBase';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Knowledge() {
  usePageTitle('Knowledge Base');
  const { profile } = useAuthContext();
  const isEditor = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [editing, setEditing] = useState<Partial<KbArticle> | null>(null);

  const { data: categories = [] } = useKbCategories();
  const { data: articles = [], isLoading } = useKbArticles({
    search: search || undefined,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    status: isEditor ? undefined : 'published',
  });

  const upsert = useUpsertArticle();

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
        icon={BookOpen}
        actions={
          isEditor && (
            <Button onClick={() => setEditing({ status: 'draft' })} className="gap-2">
              <Plus className="h-4 w-4" /> Novo artigo
            </Button>
          )
        }
      />

      <Card className="p-4 bg-card/50 backdrop-blur border-primary/20 mb-4">
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
        <EmptyState icon={FileText} title="Nenhum artigo" description="Crie o primeiro artigo da sua base." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {articles.map((a) => (
            <Card
              key={a.id}
              className="p-4 bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => isEditor && setEditing(a)}
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
                <span>{formatDistanceToNow(new Date(a.updated_at), { locale: ptBR, addSuffix: true })}</span>
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
    </NeonPageLayout>
  );
}
