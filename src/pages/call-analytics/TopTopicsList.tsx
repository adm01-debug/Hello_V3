import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tag } from 'lucide-react';

interface Props {
  topics: Array<[string, number]>;
}

export function TopTopicsList({ topics }: Props) {
  const maxCount = topics[0]?.[1] ?? 0;
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4" />Tópicos Mais Frequentes</CardTitle>
      </CardHeader>
      <CardContent>
        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map(([topic, count], index) => (
              <div key={topic} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground w-5">{index + 1}.</span>
                    {topic}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <Progress value={maxCount > 0 ? (count / maxCount) * 100 : 0} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Sem dados de tópicos disponíveis</div>
        )}
      </CardContent>
    </Card>
  );
}
