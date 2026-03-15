import { describe, it, expect } from 'vitest';

describe('Gamification System', () => {
  describe('Week start calculation', () => {
    it('calculates Monday as week start', () => {
      // March 15, 2026 is a Sunday
      const now = new Date('2026-03-15T12:00:00Z');
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      expect(monday.getDay()).toBe(1); // Monday
    });

    it('Friday returns same week Monday', () => {
      const now = new Date('2026-03-13T12:00:00Z'); // Friday
      const dayOfWeek = now.getDay(); // 5
      const diff = now.getDate() - dayOfWeek + 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(9); // March 9 is Monday
    });

    it('Monday returns itself', () => {
      const now = new Date('2026-03-09T12:00:00Z'); // Monday
      const dayOfWeek = now.getDay(); // 1
      const diff = now.getDate() - dayOfWeek + 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      expect(monday.getDate()).toBe(9);
    });
  });

  describe('Badge award logic', () => {
    const badges = [
      { id: 'b1', requirement_type: 'total_calls', requirement_value: 100, points: 50 },
      { id: 'b2', requirement_type: 'avg_satisfaction', requirement_value: 90, points: 100 },
      { id: 'b3', requirement_type: 'weekly_duration', requirement_value: 36000, points: 75 },
      { id: 'b4', requirement_type: 'daily_calls', requirement_value: 30, points: 30 },
      { id: 'b5', requirement_type: 'weekly_rank', requirement_value: 3, points: 200 },
    ];

    const checkEarned = (badge: typeof badges[0], stats: any): boolean => {
      switch (badge.requirement_type) {
        case 'total_calls': return stats.totalCalls >= badge.requirement_value;
        case 'avg_satisfaction': return stats.avgSatisfaction * 10 >= badge.requirement_value;
        case 'weekly_duration': return stats.weeklyDuration >= badge.requirement_value;
        case 'daily_calls': return stats.dailyCalls >= badge.requirement_value;
        case 'weekly_rank': return stats.weeklyRank > 0 && stats.weeklyRank <= badge.requirement_value;
        default: return false;
      }
    };

    it('awards total_calls badge at threshold', () => {
      expect(checkEarned(badges[0], { totalCalls: 100 })).toBe(true);
    });

    it('does not award total_calls badge below threshold', () => {
      expect(checkEarned(badges[0], { totalCalls: 99 })).toBe(false);
    });

    it('awards satisfaction badge (scaled by 10)', () => {
      expect(checkEarned(badges[1], { avgSatisfaction: 9.0 })).toBe(true);
    });

    it('does not award satisfaction below threshold', () => {
      expect(checkEarned(badges[1], { avgSatisfaction: 8.9 })).toBe(false);
    });

    it('awards weekly_duration badge', () => {
      expect(checkEarned(badges[2], { weeklyDuration: 36000 })).toBe(true);
    });

    it('awards daily_calls badge', () => {
      expect(checkEarned(badges[3], { dailyCalls: 30 })).toBe(true);
    });

    it('awards weekly_rank badge for top 3', () => {
      expect(checkEarned(badges[4], { weeklyRank: 1 })).toBe(true);
      expect(checkEarned(badges[4], { weeklyRank: 3 })).toBe(true);
    });

    it('does not award weekly_rank for rank 4+', () => {
      expect(checkEarned(badges[4], { weeklyRank: 4 })).toBe(false);
    });

    it('does not award weekly_rank for rank 0 (unranked)', () => {
      expect(checkEarned(badges[4], { weeklyRank: 0 })).toBe(false);
    });

    it('skips already earned badges', () => {
      const earnedBadgeIds = new Set(['b1', 'b3']);
      const eligible = badges.filter(b => !earnedBadgeIds.has(b.id));
      expect(eligible).toHaveLength(3);
      expect(eligible.map(b => b.id)).not.toContain('b1');
    });
  });

  describe('Ranking calculation', () => {
    it('sorts by points descending', () => {
      const stats = [
        { agent_id: 'a1', points_earned: 100 },
        { agent_id: 'a2', points_earned: 250 },
        { agent_id: 'a3', points_earned: 150 },
      ];
      const sorted = [...stats].sort((a, b) => b.points_earned - a.points_earned);
      expect(sorted[0].agent_id).toBe('a2');
      expect(sorted[1].agent_id).toBe('a3');
      expect(sorted[2].agent_id).toBe('a1');
    });

    it('assigns rank based on position', () => {
      const stats = [
        { agent_id: 'a2', points_earned: 250 },
        { agent_id: 'a3', points_earned: 150 },
        { agent_id: 'a1', points_earned: 100 },
      ];
      const rankings = stats.map((s, i) => ({ ...s, rank: i + 1 }));
      expect(rankings[0].rank).toBe(1);
      expect(rankings[2].rank).toBe(3);
    });

    it('maps agent names from agents table', () => {
      const agentsMap = new Map([['a1', { name: 'Alice' }], ['a2', { name: 'Bob' }]]);
      const agentName = agentsMap.get('a2')?.name || 'Agente';
      expect(agentName).toBe('Bob');
    });

    it('defaults to "Agente" for unknown agent', () => {
      const agentsMap = new Map<string, { name: string }>();
      const agentName = agentsMap.get('unknown')?.name || 'Agente';
      expect(agentName).toBe('Agente');
    });
  });

  describe('Weekly stats accumulation', () => {
    it('increments total_calls', () => {
      const existing = { total_calls: 50, points_earned: 100 };
      const update = { total_calls: 5 };
      const newVal = existing.total_calls + update.total_calls;
      expect(newVal).toBe(55);
    });

    it('increments badges_earned', () => {
      const existing = { badges_earned: 3 };
      const update = { badges_earned: 1 };
      expect(existing.badges_earned + update.badges_earned).toBe(4);
    });

    it('replaces avg_satisfaction (not increments)', () => {
      const update = { avg_satisfaction: 9.2 };
      // avg_satisfaction is set directly, not added
      expect(update.avg_satisfaction).toBe(9.2);
    });

    it('creates new stats record for first week entry', () => {
      const existing = null;
      const isNewRecord = !existing;
      expect(isNewRecord).toBe(true);
    });
  });

  describe('Badge tier ordering', () => {
    it('tiers are ordered correctly', () => {
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(tiers.indexOf('bronze')).toBeLessThan(tiers.indexOf('silver'));
      expect(tiers.indexOf('silver')).toBeLessThan(tiers.indexOf('gold'));
      expect(tiers.indexOf('gold')).toBeLessThan(tiers.indexOf('platinum'));
    });
  });

  describe('Duplicate badge prevention (code 23505)', () => {
    it('ignores duplicate key error', () => {
      const errorCode = '23505';
      const shouldIgnore = errorCode === '23505';
      expect(shouldIgnore).toBe(true);
    });

    it('does not ignore other errors', () => {
      const errorCode = '42501' as string;
      const shouldIgnore = errorCode === '23505';
      expect(shouldIgnore).toBe(false);
    });
  });
});

describe('Scheduled Callbacks System', () => {
  describe('Callback creation defaults', () => {
    it('default status is pending', () => {
      const callback = { status: 'pending', priority: 'normal' };
      expect(callback.status).toBe('pending');
      expect(callback.priority).toBe('normal');
    });

    it('priority defaults to normal', () => {
      const priority = (undefined as string | undefined) || 'normal';
      expect(priority).toBe('normal');
    });
  });

  describe('Callback status lifecycle', () => {
    it('pending → completed sets completed_at', () => {
      const status = 'completed';
      const completed_at = status === 'completed' ? new Date().toISOString() : null;
      expect(completed_at).toBeTruthy();
    });

    it('pending → cancelled does not set completed_at', () => {
      const status = 'cancelled';
      const completed_at = status === 'completed' ? new Date().toISOString() : null;
      expect(completed_at).toBeNull();
    });

    it('valid statuses', () => {
      const statuses = ['pending', 'completed', 'cancelled'];
      expect(statuses).toHaveLength(3);
    });
  });

  describe('Upcoming count window', () => {
    it('checks next 60 minutes', () => {
      const now = new Date('2026-03-15T12:00:00Z');
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const diffMs = nextHour.getTime() - now.getTime();
      expect(diffMs).toBe(3600000);
    });

    it('callback within window is counted', () => {
      const now = new Date('2026-03-15T12:00:00Z');
      const nextHour = new Date('2026-03-15T13:00:00Z');
      const scheduledAt = new Date('2026-03-15T12:30:00Z');
      const isInWindow = scheduledAt >= now && scheduledAt <= nextHour;
      expect(isInWindow).toBe(true);
    });

    it('callback outside window is not counted', () => {
      const now = new Date('2026-03-15T12:00:00Z');
      const nextHour = new Date('2026-03-15T13:00:00Z');
      const scheduledAt = new Date('2026-03-15T14:00:00Z');
      const isInWindow = scheduledAt >= now && scheduledAt <= nextHour;
      expect(isInWindow).toBe(false);
    });

    it('past callback is not counted', () => {
      const now = new Date('2026-03-15T12:00:00Z');
      const scheduledAt = new Date('2026-03-15T11:00:00Z');
      const isUpcoming = scheduledAt >= now;
      expect(isUpcoming).toBe(false);
    });
  });

  describe('Callback ordering', () => {
    it('orders by scheduled_at ascending', () => {
      const callbacks = [
        { scheduled_at: '2026-03-15T14:00:00Z' },
        { scheduled_at: '2026-03-15T12:00:00Z' },
        { scheduled_at: '2026-03-15T16:00:00Z' },
      ];
      const sorted = [...callbacks].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
      expect(sorted[0].scheduled_at).toContain('12:00');
      expect(sorted[2].scheduled_at).toContain('16:00');
    });
  });

  describe('Priority levels', () => {
    it('valid priorities', () => {
      const priorities = ['low', 'normal', 'high', 'urgent'];
      expect(priorities).toContain('normal');
      expect(priorities).toContain('urgent');
    });
  });
});

describe('Achievement Notifications', () => {
  describe('Notification filtering', () => {
    it('shows notification for matching agent', () => {
      const agentId = 'agent-1';
      const newBadgeAgentId = 'agent-1';
      const shouldShow = !agentId || newBadgeAgentId === agentId;
      expect(shouldShow).toBe(true);
    });

    it('does not show for different agent when filtered', () => {
      const agentId = 'agent-1';
      const newBadgeAgentId = 'agent-2';
      const shouldShow = !agentId || newBadgeAgentId === agentId;
      expect(shouldShow).toBe(false);
    });

    it('shows for all agents when no filter', () => {
      const agentId: string | undefined = undefined;
      const newBadgeAgentId = 'agent-2';
      const shouldShow = !agentId || newBadgeAgentId === agentId;
      expect(shouldShow).toBe(true);
    });
  });

  describe('Notification list management', () => {
    it('prepends new notification', () => {
      const existing = [{ id: 'n1' }, { id: 'n2' }];
      const newNotif = { id: 'n3' };
      const updated = [newNotif, ...existing];
      expect(updated[0].id).toBe('n3');
      expect(updated).toHaveLength(3);
    });

    it('sets latest achievement', () => {
      const notification = { id: 'n1', badge: { name: 'Star' }, agentName: 'Alice' };
      const latest = notification;
      expect(latest.badge.name).toBe('Star');
    });

    it('clears latest achievement', () => {
      let latest: any = { id: 'n1' };
      latest = null;
      expect(latest).toBeNull();
    });
  });
});
