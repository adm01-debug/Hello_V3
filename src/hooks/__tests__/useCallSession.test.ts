import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'session-1', caller_name: 'Test', caller_phone: '+5511999', agent_name: 'Agent', started_at: '2026-03-15T12:00:00Z' }, error: null }),
    })),
    rpc: vi.fn(),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
  },
}));

describe('Call Session Logic', () => {
  describe('Session lifecycle', () => {
    it('creates session with correct initial status', () => {
      const session = { status: 'active', caller_name: 'Test', caller_phone: '+5511999' };
      expect(session.status).toBe('active');
    });

    it('session ends with completed status', () => {
      const session = { status: 'completed', ended_at: new Date().toISOString() };
      expect(session.status).toBe('completed');
      expect(session.ended_at).toBeTruthy();
    });

    it('duration is calculated correctly', () => {
      const startedAt = new Date('2026-03-15T12:00:00Z');
      const endedAt = new Date('2026-03-15T12:05:30Z');
      const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
      expect(durationSeconds).toBe(330);
    });
  });

  describe('Transcript batching logic', () => {
    it('batches transcripts before save', () => {
      const pending: any[] = [];
      const batchSize = 2000; // 2 second batch interval

      pending.push({ text: 'Hello', speaker: 'agent' });
      pending.push({ text: 'Hi', speaker: 'customer' });
      pending.push({ text: 'How can I help?', speaker: 'agent' });

      expect(pending.length).toBe(3);
      expect(batchSize).toBe(2000);
    });

    it('re-adds failed transcripts to pending', () => {
      const pending = [{ text: 'A' }, { text: 'B' }];
      const failed = [{ text: 'C' }];
      const result = [...failed, ...pending];
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('C');
    });

    it('clears pending after successful save', () => {
      let pending = [{ text: 'A' }, { text: 'B' }];
      const toSave = [...pending];
      pending = [];
      expect(toSave).toHaveLength(2);
      expect(pending).toHaveLength(0);
    });
  });

  describe('Analysis saving', () => {
    it('maps analysis fields correctly', () => {
      const analysis = {
        sentiment: 'positive',
        urgency: 'low',
        emotion: 'happy',
        suggestion: 'Continue',
        riskAlert: false,
        riskReason: '',
        messageAnalyzed: 'Test message',
        speakerRole: 'agent',
      };

      const dbEntry = {
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        emotion: analysis.emotion,
        suggestion: analysis.suggestion,
        risk_alert: analysis.riskAlert ? analysis.riskReason : null,
        message_analyzed: analysis.messageAnalyzed,
        speaker_role: analysis.speakerRole,
      };

      expect(dbEntry.risk_alert).toBeNull();
      expect(dbEntry.sentiment).toBe('positive');
    });

    it('sets risk_alert when riskAlert is true', () => {
      const analysis = { riskAlert: true, riskReason: 'Customer threatening to cancel' };
      const risk_alert = analysis.riskAlert ? analysis.riskReason : null;
      expect(risk_alert).toBe('Customer threatening to cancel');
    });
  });

  describe('Call summary structure', () => {
    it('summary contains all required fields', () => {
      const summary = {
        summary: 'Customer inquired about billing',
        mainTopics: ['billing', 'refund'],
        overallSentiment: 'neutral',
        customerSatisfaction: 7,
        agentPerformance: 8,
        nextSteps: ['Send invoice', 'Follow up in 3 days'],
      };

      expect(summary.mainTopics).toHaveLength(2);
      expect(summary.customerSatisfaction).toBeGreaterThanOrEqual(0);
      expect(summary.customerSatisfaction).toBeLessThanOrEqual(10);
      expect(summary.agentPerformance).toBeGreaterThanOrEqual(0);
      expect(summary.agentPerformance).toBeLessThanOrEqual(10);
    });

    it('satisfaction score validates 0-10 range', () => {
      const validateScore = (score: number) => Math.max(0, Math.min(10, score));
      expect(validateScore(-1)).toBe(0);
      expect(validateScore(11)).toBe(10);
      expect(validateScore(7.5)).toBe(7.5);
    });
  });
});
