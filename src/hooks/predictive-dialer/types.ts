export interface DialerCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  mode: string;
  max_concurrent_calls: number;
  call_timeout_seconds: number;
  retry_attempts: number;
  retry_delay_minutes: number;
  working_hours_start: string | null;
  working_hours_end: string | null;
  total_contacts: number;
  completed_contacts: number;
  successful_contacts: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DialerQueueItem {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  phone: string;
  name: string | null;
  priority: number;
  status: string;
  attempts: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  result: string | null;
  result_notes: string | null;
  assigned_agent: string | null;
  call_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  mode?: string;
  max_concurrent_calls?: number;
  call_timeout_seconds?: number;
  retry_attempts?: number;
  retry_delay_minutes?: number;
  working_hours_start?: string;
  working_hours_end?: string;
  created_by?: string;
  status?: string;
}

export interface AddToQueueInput {
  campaign_id: string;
  phone: string;
  name?: string;
  contact_id?: string;
  priority?: number;
}

export type CallResult =
  | 'answered'
  | 'no_answer'
  | 'busy'
  | 'voicemail'
  | 'wrong_number'
  | 'callback';
