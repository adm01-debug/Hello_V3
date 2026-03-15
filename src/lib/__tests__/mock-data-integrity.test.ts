import { describe, it, expect } from 'vitest';
import {
  mockContacts,
  mockCallHistory,
  mockActiveCall,
  mockAgents,
  mockQueueStats,
  mockDashboardStats,
  mockHourlyCallVolume,
  formatDuration,
  formatPhoneNumber,
  getInitials,
  type Contact,
  type CallRecord,
  type Agent,
  type QueueStats,
} from '@/data/mockData';

// ===================== Mock Data Integrity =====================
describe('Mock Data Integrity', () => {
  describe('Contacts', () => {
    it('has at least 5 contacts', () => {
      expect(mockContacts.length).toBeGreaterThanOrEqual(5);
    });

    it('all contacts have required fields', () => {
      mockContacts.forEach(c => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.phone).toBeTruthy();
        expect(typeof c.favorite).toBe('boolean');
      });
    });

    it('all contact IDs are unique', () => {
      const ids = mockContacts.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('phone numbers follow Brazilian format', () => {
      mockContacts.forEach(c => {
        expect(c.phone).toMatch(/\+55/);
      });
    });

    it('all contacts have valid email format', () => {
      mockContacts.forEach(c => {
        if (c.email) {
          expect(c.email).toMatch(/@/);
          expect(c.email).toMatch(/\./);
        }
      });
    });

    it('some contacts are favorited', () => {
      expect(mockContacts.filter(c => c.favorite).length).toBeGreaterThan(0);
    });

    it('some contacts have lastCall dates', () => {
      const withDates = mockContacts.filter(c => c.lastCall);
      expect(withDates.length).toBeGreaterThan(0);
      withDates.forEach(c => {
        expect(c.lastCall).toBeInstanceOf(Date);
      });
    });
  });

  describe('Call History', () => {
    it('has at least 5 call records', () => {
      expect(mockCallHistory.length).toBeGreaterThanOrEqual(5);
    });

    it('all records have required fields', () => {
      mockCallHistory.forEach(r => {
        expect(r.id).toBeTruthy();
        expect(r.contactId).toBeTruthy();
        expect(r.contactName).toBeTruthy();
        expect(r.contactPhone).toBeTruthy();
        expect(['incoming', 'outgoing', 'missed']).toContain(r.type);
        expect(['completed', 'missed', 'voicemail']).toContain(r.status);
        expect(typeof r.duration).toBe('number');
        expect(r.duration).toBeGreaterThanOrEqual(0);
        expect(r.timestamp).toBeInstanceOf(Date);
      });
    });

    it('all record IDs are unique', () => {
      const ids = mockCallHistory.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('missed calls have zero duration', () => {
      mockCallHistory
        .filter(r => r.status === 'missed')
        .forEach(r => {
          expect(r.duration).toBe(0);
        });
    });

    it('completed calls have positive duration', () => {
      mockCallHistory
        .filter(r => r.status === 'completed')
        .forEach(r => {
          expect(r.duration).toBeGreaterThan(0);
        });
    });

    it('some calls have recordings', () => {
      expect(mockCallHistory.filter(r => r.recording).length).toBeGreaterThan(0);
    });

    it('contactIds reference valid contacts', () => {
      const contactIds = new Set(mockContacts.map(c => c.id));
      mockCallHistory.forEach(r => {
        expect(contactIds.has(r.contactId)).toBe(true);
      });
    });
  });

  describe('Active Call', () => {
    it('exists and has required structure', () => {
      expect(mockActiveCall).toBeTruthy();
      expect(mockActiveCall!.id).toBeTruthy();
      expect(mockActiveCall!.contactName).toBeTruthy();
      expect(mockActiveCall!.contactPhone).toBeTruthy();
      expect(['incoming', 'outgoing']).toContain(mockActiveCall!.type);
      expect(['ringing', 'connected', 'hold', 'transferring']).toContain(mockActiveCall!.status);
      expect(typeof mockActiveCall!.muted).toBe('boolean');
    });
  });

  describe('Agents', () => {
    it('has at least 3 agents', () => {
      expect(mockAgents.length).toBeGreaterThanOrEqual(3);
    });

    it('all agents have required fields', () => {
      mockAgents.forEach(a => {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(['available', 'busy', 'away', 'offline']).toContain(a.status);
        expect(typeof a.callsToday).toBe('number');
        expect(typeof a.avgCallDuration).toBe('number');
      });
    });

    it('all agent IDs are unique', () => {
      const ids = mockAgents.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('busy agents have current call', () => {
      mockAgents
        .filter(a => a.status === 'busy')
        .forEach(a => {
          expect(a.currentCall).toBeTruthy();
        });
    });

    it('available agents have no current call', () => {
      mockAgents
        .filter(a => a.status === 'available')
        .forEach(a => {
          expect(a.currentCall).toBeUndefined();
        });
    });
  });

  describe('Queue Stats', () => {
    it('has all required metrics', () => {
      expect(typeof mockQueueStats.waiting).toBe('number');
      expect(typeof mockQueueStats.avgWaitTime).toBe('number');
      expect(typeof mockQueueStats.longestWait).toBe('number');
      expect(typeof mockQueueStats.abandoned).toBe('number');
      expect(typeof mockQueueStats.serviceLevelPercent).toBe('number');
    });

    it('service level is between 0-100', () => {
      expect(mockQueueStats.serviceLevelPercent).toBeGreaterThanOrEqual(0);
      expect(mockQueueStats.serviceLevelPercent).toBeLessThanOrEqual(100);
    });

    it('longest wait >= avg wait', () => {
      expect(mockQueueStats.longestWait).toBeGreaterThanOrEqual(mockQueueStats.avgWaitTime);
    });

    it('no negative values', () => {
      expect(mockQueueStats.waiting).toBeGreaterThanOrEqual(0);
      expect(mockQueueStats.avgWaitTime).toBeGreaterThanOrEqual(0);
      expect(mockQueueStats.abandoned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dashboard Stats', () => {
    it('has all required fields', () => {
      expect(typeof mockDashboardStats.totalCallsToday).toBe('number');
      expect(typeof mockDashboardStats.avgCallDuration).toBe('number');
      expect(typeof mockDashboardStats.answeredRate).toBe('number');
      expect(typeof mockDashboardStats.activeAgents).toBe('number');
      expect(typeof mockDashboardStats.totalAgents).toBe('number');
    });

    it('active agents <= total agents', () => {
      expect(mockDashboardStats.activeAgents).toBeLessThanOrEqual(mockDashboardStats.totalAgents);
    });

    it('answered rate is between 0-100', () => {
      expect(mockDashboardStats.answeredRate).toBeGreaterThanOrEqual(0);
      expect(mockDashboardStats.answeredRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Hourly Call Volume', () => {
    it('has data points', () => {
      expect(mockHourlyCallVolume.length).toBeGreaterThan(0);
    });

    it('each point has required structure', () => {
      mockHourlyCallVolume.forEach(point => {
        expect(point.hour).toMatch(/^\d{2}:\d{2}$/);
        expect(typeof point.incoming).toBe('number');
        expect(typeof point.outgoing).toBe('number');
        expect(point.incoming).toBeGreaterThanOrEqual(0);
        expect(point.outgoing).toBeGreaterThanOrEqual(0);
      });
    });

    it('hours are in chronological order', () => {
      for (let i = 1; i < mockHourlyCallVolume.length; i++) {
        expect(mockHourlyCallVolume[i].hour > mockHourlyCallVolume[i - 1].hour).toBe(true);
      }
    });
  });
});

// ===================== Helper Functions =====================
describe('Helper Functions', () => {
  describe('formatDuration', () => {
    it('formats zero seconds', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('formats seconds < 60', () => {
      expect(formatDuration(30)).toBe('0:30');
    });

    it('formats exactly 60 seconds', () => {
      expect(formatDuration(60)).toBe('1:00');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(185)).toBe('3:05');
    });

    it('pads seconds with zero', () => {
      expect(formatDuration(61)).toBe('1:01');
      expect(formatDuration(69)).toBe('1:09');
    });

    it('handles large durations', () => {
      expect(formatDuration(3600)).toBe('60:00');
      expect(formatDuration(3661)).toBe('61:01');
    });

    it('handles single digit seconds', () => {
      expect(formatDuration(5)).toBe('0:05');
    });
  });

  describe('formatPhoneNumber', () => {
    it('returns phone as-is', () => {
      const phone = '+55 11 99999-1234';
      expect(formatPhoneNumber(phone)).toBe(phone);
    });

    it('handles empty string', () => {
      expect(formatPhoneNumber('')).toBe('');
    });
  });

  describe('getInitials', () => {
    it('extracts first two initials', () => {
      expect(getInitials('João Silva')).toBe('JS');
    });

    it('handles single name', () => {
      expect(getInitials('João')).toBe('J');
    });

    it('handles three names', () => {
      expect(getInitials('João Carlos Silva')).toBe('JC');
    });

    it('returns uppercase', () => {
      expect(getInitials('maria santos')).toBe('MS');
    });

    it('handles names with accents', () => {
      const result = getInitials('Ângelo Último');
      expect(result).toBe('ÂÚ');
    });

    it('limits to 2 characters', () => {
      const result = getInitials('A B C D E');
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });
});

// ===================== Type Contracts =====================
describe('Type Contracts', () => {
  it('Contact type has all required fields', () => {
    const contact: Contact = {
      id: '1', name: 'Test', phone: '+55', favorite: false,
    };
    expect(contact.id).toBeDefined();
    expect(contact.name).toBeDefined();
    expect(contact.phone).toBeDefined();
    expect(contact.favorite).toBeDefined();
  });

  it('CallRecord type has all required fields', () => {
    const record: CallRecord = {
      id: '1', contactId: '1', contactName: 'Test', contactPhone: '+55',
      type: 'incoming', status: 'completed', duration: 0, timestamp: new Date(),
    };
    expect(record.type).toBe('incoming');
  });

  it('Agent status values are exhaustive', () => {
    const statuses: Agent['status'][] = ['available', 'busy', 'away', 'offline'];
    expect(statuses).toHaveLength(4);
  });

  it('QueueStats fields are numeric', () => {
    const stats: QueueStats = { waiting: 0, avgWaitTime: 0, longestWait: 0, abandoned: 0, serviceLevelPercent: 0 };
    Object.values(stats).forEach(v => expect(typeof v).toBe('number'));
  });
});
