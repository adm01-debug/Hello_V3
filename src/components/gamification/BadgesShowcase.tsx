import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge as BadgeType, AgentBadge } from '@/hooks/useGamification';
import { BadgeCard } from './BadgeCard';

interface BadgesShowcaseProps {
  badges: BadgeType[];
  agentBadges: AgentBadge[];
}

export function BadgesShowcase({ badges, agentBadges }: BadgesShowcaseProps) {
  const earnedBadgeIds = new Set(agentBadges.map(ab => ab.badge_id));
  
  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'milestone', label: 'Marcos' },
    { id: 'satisfaction', label: 'Satisfação' },
    { id: 'performance', label: 'Performance' },
    { id: 'dedication', label: 'Dedicação' },
    { id: 'ranking', label: 'Ranking' },
  ];

  const filterBadgesByCategory = (category: string) => {
    if (category === 'all') return badges;
    return badges.filter(b => b.category === category);
  };

  const earnedCount = agentBadges.length;
  const totalCount = badges.length;
  const totalPoints = agentBadges.reduce((sum, ab) => {
    const badge = badges.find(b => b.id === ab.badge_id);
    return sum + (badge?.points || 0);
  }, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-primary" />
            Conquistas
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-bold text-primary">{earnedCount}</span>/{totalCount} badges
            </span>
            <span className="text-muted-foreground">
              <span className="font-bold text-primary">{totalPoints}</span> pontos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {filterBadgesByCategory(cat.id).map(badge => {
                  const agentBadge = agentBadges.find(ab => ab.badge_id === badge.id);
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      earned={earnedBadgeIds.has(badge.id)}
                      earnedAt={agentBadge?.earned_at}
                      size="sm"
                    />
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
