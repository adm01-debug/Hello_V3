export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  company?: string;
  favorite: boolean;
  lastCall?: Date;
}

export interface CallRecord {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed' | 'voicemail';
  duration: number; // seconds
  timestamp: Date;
  recording?: string;
}

export interface ActiveCall {
  id: string;
  contactName: string;
  contactPhone: string;
  type: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected' | 'hold' | 'transferring';
  startTime: Date;
  duration: number;
  muted: boolean;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  currentCall?: string;
  callsToday: number;
  avgCallDuration: number;
}

export interface QueueStats {
  waiting: number;
  avgWaitTime: number;
  longestWait: number;
  abandoned: number;
  serviceLevelPercent: number;
}

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '+55 11 99999-1234',
    email: 'joao.silva@email.com',
    company: 'Tech Solutions',
    favorite: true,
    lastCall: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '+55 11 98888-5678',
    email: 'maria.santos@email.com',
    company: 'Digital Agency',
    favorite: true,
    lastCall: new Date('2024-01-15T09:15:00'),
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    phone: '+55 21 97777-9012',
    email: 'pedro@oliveira.com',
    company: 'StartupX',
    favorite: false,
    lastCall: new Date('2024-01-14T16:45:00'),
  },
  {
    id: '4',
    name: 'Ana Costa',
    phone: '+55 11 96666-3456',
    email: 'ana.costa@empresa.com',
    company: 'Consultoria ABC',
    favorite: false,
    lastCall: new Date('2024-01-14T14:20:00'),
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    phone: '+55 31 95555-7890',
    email: 'carlos.mendes@corp.com',
    company: 'FinTech Brasil',
    favorite: true,
    lastCall: new Date('2024-01-13T11:00:00'),
  },
  {
    id: '6',
    name: 'Fernanda Lima',
    phone: '+55 11 94444-1234',
    email: 'fernanda@lima.com',
    company: 'Marketing Pro',
    favorite: false,
  },
  {
    id: '7',
    name: 'Roberto Gomes',
    phone: '+55 21 93333-5678',
    email: 'roberto.gomes@tech.com',
    company: 'DevHouse',
    favorite: false,
  },
  {
    id: '8',
    name: 'Juliana Alves',
    phone: '+55 11 92222-9012',
    email: 'juliana@alves.com',
    company: 'E-commerce Plus',
    favorite: true,
  },
];

// Mock Call History
export const mockCallHistory: CallRecord[] = [
  {
    id: '1',
    contactId: '1',
    contactName: 'João Silva',
    contactPhone: '+55 11 99999-1234',
    type: 'outgoing',
    status: 'completed',
    duration: 342,
    timestamp: new Date('2024-01-15T10:30:00'),
    recording: 'rec_001.mp3',
  },
  {
    id: '2',
    contactId: '2',
    contactName: 'Maria Santos',
    contactPhone: '+55 11 98888-5678',
    type: 'incoming',
    status: 'completed',
    duration: 128,
    timestamp: new Date('2024-01-15T09:15:00'),
  },
  {
    id: '3',
    contactId: '3',
    contactName: 'Pedro Oliveira',
    contactPhone: '+55 21 97777-9012',
    type: 'incoming',
    status: 'missed',
    duration: 0,
    timestamp: new Date('2024-01-15T08:45:00'),
  },
  {
    id: '4',
    contactId: '4',
    contactName: 'Ana Costa',
    contactPhone: '+55 11 96666-3456',
    type: 'outgoing',
    status: 'completed',
    duration: 567,
    timestamp: new Date('2024-01-14T16:45:00'),
    recording: 'rec_002.mp3',
  },
  {
    id: '5',
    contactId: '5',
    contactName: 'Carlos Mendes',
    contactPhone: '+55 31 95555-7890',
    type: 'incoming',
    status: 'voicemail',
    duration: 45,
    timestamp: new Date('2024-01-14T14:20:00'),
  },
  {
    id: '6',
    contactId: '1',
    contactName: 'João Silva',
    contactPhone: '+55 11 99999-1234',
    type: 'outgoing',
    status: 'completed',
    duration: 234,
    timestamp: new Date('2024-01-14T11:00:00'),
  },
  {
    id: '7',
    contactId: '6',
    contactName: 'Fernanda Lima',
    contactPhone: '+55 11 94444-1234',
    type: 'incoming',
    status: 'missed',
    duration: 0,
    timestamp: new Date('2024-01-13T17:30:00'),
  },
  {
    id: '8',
    contactId: '7',
    contactName: 'Roberto Gomes',
    contactPhone: '+55 21 93333-5678',
    type: 'outgoing',
    status: 'completed',
    duration: 890,
    timestamp: new Date('2024-01-13T15:00:00'),
    recording: 'rec_003.mp3',
  },
];

// Mock Active Call
export const mockActiveCall: ActiveCall | null = {
  id: 'active-1',
  contactName: 'João Silva',
  contactPhone: '+55 11 99999-1234',
  type: 'incoming',
  status: 'connected',
  startTime: new Date(),
  duration: 0,
  muted: false,
};

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Lucas Ferreira',
    status: 'available',
    callsToday: 24,
    avgCallDuration: 180,
  },
  {
    id: '2',
    name: 'Camila Rocha',
    status: 'busy',
    currentCall: 'João Silva',
    callsToday: 31,
    avgCallDuration: 145,
  },
  {
    id: '3',
    name: 'Rafael Souza',
    status: 'available',
    callsToday: 18,
    avgCallDuration: 220,
  },
  {
    id: '4',
    name: 'Beatriz Martins',
    status: 'away',
    callsToday: 27,
    avgCallDuration: 165,
  },
  {
    id: '5',
    name: 'Diego Almeida',
    status: 'busy',
    currentCall: 'Maria Santos',
    callsToday: 22,
    avgCallDuration: 195,
  },
];

// Mock Queue Stats
export const mockQueueStats: QueueStats = {
  waiting: 3,
  avgWaitTime: 45,
  longestWait: 120,
  abandoned: 2,
  serviceLevelPercent: 87,
};

// Dashboard Stats
export const mockDashboardStats = {
  totalCallsToday: 156,
  totalCallsChange: 12,
  avgCallDuration: 185,
  durationChange: -5,
  answeredRate: 94,
  rateChange: 2,
  activeAgents: 8,
  totalAgents: 12,
};

// Hourly call volume for chart
export const mockHourlyCallVolume = [
  { hour: '08:00', incoming: 12, outgoing: 8 },
  { hour: '09:00', incoming: 24, outgoing: 15 },
  { hour: '10:00', incoming: 31, outgoing: 22 },
  { hour: '11:00', incoming: 28, outgoing: 19 },
  { hour: '12:00', incoming: 15, outgoing: 10 },
  { hour: '13:00', incoming: 18, outgoing: 12 },
  { hour: '14:00', incoming: 35, outgoing: 28 },
  { hour: '15:00', incoming: 42, outgoing: 31 },
  { hour: '16:00', incoming: 38, outgoing: 25 },
  { hour: '17:00', incoming: 22, outgoing: 18 },
];

  return phone;
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
