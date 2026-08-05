export interface LDAPConfig {
  serverUrl: string;
  port: string;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  useTLS: boolean;
  searchFilter: string;
  syncInterval: string;
  fieldMapping: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
  };
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  contactsSynced: number;
  contactsCreated: number;
  contactsUpdated: number;
  contactsFailed: number;
  duration: string;
  error?: string;
}

export const DEFAULT_LDAP_CONFIG: LDAPConfig = {
  serverUrl: '',
  port: '389',
  baseDn: '',
  bindDn: '',
  bindPassword: '',
  useTLS: false,
  searchFilter: '(objectClass=person)',
  syncInterval: '60',
  fieldMapping: {
    name: 'cn',
    email: 'mail',
    phone: 'telephoneNumber',
    company: 'company',
    position: 'title',
  },
};

export const MOCK_SYNC_LOGS: SyncLog[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    status: 'success',
    contactsSynced: 245,
    contactsCreated: 12,
    contactsUpdated: 233,
    contactsFailed: 0,
    duration: '4.2s',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'partial',
    contactsSynced: 240,
    contactsCreated: 5,
    contactsUpdated: 230,
    contactsFailed: 5,
    duration: '5.1s',
    error: '5 contatos com DN inválido',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'error',
    contactsSynced: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    contactsFailed: 0,
    duration: '0.3s',
    error: 'Falha na conexão com servidor LDAP',
  },
];
