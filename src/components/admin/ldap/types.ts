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
