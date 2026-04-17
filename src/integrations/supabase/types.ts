export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_journey_history: {
        Row: {
          account_id: string
          created_at: string
          from_stage: string | null
          id: string
          metadata: Json | null
          reason: string | null
          to_stage: string
          triggered_by: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          from_stage?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          to_stage: string
          triggered_by?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          from_stage?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          to_stage?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_journey_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          id: string
          last_failed_at: string | null
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          id?: string
          last_failed_at?: string | null
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          id?: string
          last_failed_at?: string | null
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          arr: number | null
          churn_risk_score: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          csm_agent_name: string | null
          current_stage: string | null
          domain: string | null
          health_factors: Json | null
          health_score: number | null
          id: string
          last_contact_at: string | null
          metadata: Json | null
          mrr: number | null
          name: string
          next_review_at: string | null
          notes: string | null
          segment: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          arr?: number | null
          churn_risk_score?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          csm_agent_name?: string | null
          current_stage?: string | null
          domain?: string | null
          health_factors?: Json | null
          health_score?: number | null
          id?: string
          last_contact_at?: string | null
          metadata?: Json | null
          mrr?: number | null
          name: string
          next_review_at?: string | null
          notes?: string | null
          segment?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          arr?: number | null
          churn_risk_score?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          csm_agent_name?: string | null
          current_stage?: string | null
          domain?: string | null
          health_factors?: Json | null
          health_score?: number | null
          id?: string
          last_contact_at?: string | null
          metadata?: Json | null
          mrr?: number | null
          name?: string
          next_review_at?: string | null
          notes?: string | null
          segment?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity_at: string | null
          location: Json | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location?: Json | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_badges: {
        Row: {
          agent_id: string
          badge_id: string
          earned_at: string
          id: string
        }
        Insert: {
          agent_id: string
          badge_id: string
          earned_at?: string
          id?: string
        }
        Update: {
          agent_id?: string
          badge_id?: string
          earned_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_badges_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_devices: {
        Row: {
          agent_name: string
          created_at: string
          device_name: string
          device_type: string
          extension: string | null
          id: string
          is_enabled: boolean
          ring_delay_seconds: number
          ring_order: number
          sip_uri: string | null
          updated_at: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          device_name: string
          device_type?: string
          extension?: string | null
          id?: string
          is_enabled?: boolean
          ring_delay_seconds?: number
          ring_order?: number
          sip_uri?: string | null
          updated_at?: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          device_name?: string
          device_type?: string
          extension?: string | null
          id?: string
          is_enabled?: boolean
          ring_delay_seconds?: number
          ring_order?: number
          sip_uri?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_goals: {
        Row: {
          agent_name: string
          calls_target: number
          created_at: string
          id: string
          performance_target: number
          satisfaction_target: number
          updated_at: string
        }
        Insert: {
          agent_name: string
          calls_target?: number
          created_at?: string
          id?: string
          performance_target?: number
          satisfaction_target?: number
          updated_at?: string
        }
        Update: {
          agent_name?: string
          calls_target?: number
          created_at?: string
          id?: string
          performance_target?: number
          satisfaction_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_ring_settings: {
        Row: {
          agent_name: string
          created_at: string
          dnd_enabled: boolean
          dnd_schedule: Json | null
          fallback_action: string
          id: string
          ring_strategy: string
          ring_timeout_seconds: number
          updated_at: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          dnd_enabled?: boolean
          dnd_schedule?: Json | null
          fallback_action?: string
          id?: string
          ring_strategy?: string
          ring_timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          dnd_enabled?: boolean
          dnd_schedule?: Json | null
          fallback_action?: string
          id?: string
          ring_strategy?: string
          ring_timeout_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_shifts: {
        Row: {
          agent_name: string
          break_minutes: number
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          notes: string | null
          shift_date: string
          start_time: string
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          agent_name: string
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          shift_date: string
          start_time: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_name?: string
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          shift_date?: string
          start_time?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_skills: {
        Row: {
          agent_name: string
          certified_at: string | null
          certified_by: string | null
          created_at: string
          id: string
          proficiency: number
          skill_id: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          id?: string
          proficiency?: number
          skill_id: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          id?: string
          proficiency?: number
          skill_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_weekly_stats: {
        Row: {
          agent_id: string
          avg_performance: number | null
          avg_satisfaction: number | null
          badges_earned: number
          created_at: string
          id: string
          points_earned: number
          total_calls: number
          total_duration_seconds: number
          updated_at: string
          week_start: string
        }
        Insert: {
          agent_id: string
          avg_performance?: number | null
          avg_satisfaction?: number | null
          badges_earned?: number
          created_at?: string
          id?: string
          points_earned?: number
          total_calls?: number
          total_duration_seconds?: number
          updated_at?: string
          week_start: string
        }
        Update: {
          agent_id?: string
          avg_performance?: number | null
          avg_satisfaction?: number | null
          badges_earned?: number
          created_at?: string
          id?: string
          points_earned?: number
          total_calls?: number
          total_duration_seconds?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_weekly_stats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          extension: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          extension: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          extension?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number
          requirement_type: string
          requirement_value: number
          tier: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          points?: number
          requirement_type: string
          requirement_value: number
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
          tier?: string
        }
        Relationships: []
      }
      barge_in_sessions: {
        Row: {
          agent_name: string
          call_session_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          status: string
          supervisor_name: string
        }
        Insert: {
          agent_name: string
          call_session_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          supervisor_name: string
        }
        Update: {
          agent_name?: string
          call_session_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          supervisor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "barge_in_sessions_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_card_triggers: {
        Row: {
          battle_card_id: string
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          match_type: string
        }
        Insert: {
          battle_card_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          match_type?: string
        }
        Update: {
          battle_card_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          match_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_card_triggers_battle_card_id_fkey"
            columns: ["battle_card_id"]
            isOneToOne: false
            referencedRelation: "battle_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_cards: {
        Row: {
          competitor_name: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          objection_responses: Json | null
          our_strengths: string[] | null
          talking_points: string[] | null
          their_weaknesses: string[] | null
          updated_at: string
        }
        Insert: {
          competitor_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          objection_responses?: Json | null
          our_strengths?: string[] | null
          talking_points?: string[] | null
          their_weaknesses?: string[] | null
          updated_at?: string
        }
        Update: {
          competitor_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          objection_responses?: Json | null
          our_strengths?: string[] | null
          talking_points?: string[] | null
          their_weaknesses?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      blocked_access_logs: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: string
          reason: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address: string
          reason: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          reason?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cadence_enrollments: {
        Row: {
          agent_name: string | null
          cadence_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          current_step: number
          deal_id: string | null
          id: string
          next_action_at: string | null
          paused_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          cadence_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number
          deal_id?: string | null
          id?: string
          next_action_at?: string | null
          paused_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          cadence_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number
          deal_id?: string | null
          id?: string
          next_action_at?: string | null
          paused_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_enrollments_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_steps: {
        Row: {
          body: string | null
          cadence_id: string
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          metadata: Json | null
          step_order: number
          step_type: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          cadence_id: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          metadata?: Json | null
          step_order: number
          step_type: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          cadence_id?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          metadata?: Json | null
          step_order?: number
          step_type?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      cadences: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_alerts: {
        Row: {
          alert_type: string
          call_session_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          call_session_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          call_session_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_alerts_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_analyses: {
        Row: {
          call_session_id: string
          created_at: string
          emotion: string | null
          id: string
          message_analyzed: string | null
          risk_alert: string | null
          sentiment: string | null
          speaker_role: string | null
          suggestion: string | null
          urgency: string | null
        }
        Insert: {
          call_session_id: string
          created_at?: string
          emotion?: string | null
          id?: string
          message_analyzed?: string | null
          risk_alert?: string | null
          sentiment?: string | null
          speaker_role?: string | null
          suggestion?: string | null
          urgency?: string | null
        }
        Update: {
          call_session_id?: string
          created_at?: string
          emotion?: string | null
          id?: string
          message_analyzed?: string | null
          risk_alert?: string | null
          sentiment?: string | null
          speaker_role?: string | null
          suggestion?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_analyses_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_flows: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          flow_data: Json
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_key_moments: {
        Row: {
          call_session_id: string
          confidence: number | null
          created_at: string
          id: string
          metadata: Json | null
          moment_type: string
          quote: string
          speaker: string | null
          timestamp_seconds: number
        }
        Insert: {
          call_session_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          moment_type: string
          quote: string
          speaker?: string | null
          timestamp_seconds?: number
        }
        Update: {
          call_session_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          moment_type?: string
          quote?: string
          speaker?: string | null
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "call_key_moments_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_playlists: {
        Row: {
          auto_query: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_shared: boolean
          name: string
          owner_agent_name: string | null
          playlist_type: string
          shared_with: string[] | null
          updated_at: string
        }
        Insert: {
          auto_query?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean
          name: string
          owner_agent_name?: string | null
          playlist_type?: string
          shared_with?: string[] | null
          updated_at?: string
        }
        Update: {
          auto_query?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean
          name?: string
          owner_agent_name?: string | null
          playlist_type?: string
          shared_with?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      call_recordings: {
        Row: {
          call_session_id: string | null
          conference_id: string | null
          created_at: string
          duration_seconds: number | null
          file_path: string
          file_size_bytes: number | null
          id: string
          participant_count: number | null
          recorded_at: string
          source: string
        }
        Insert: {
          call_session_id?: string | null
          conference_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_path: string
          file_size_bytes?: number | null
          id?: string
          participant_count?: number | null
          recorded_at?: string
          source?: string
        }
        Update: {
          call_session_id?: string | null
          conference_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          participant_count?: number | null
          recorded_at?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_recordings_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_scorecards: {
        Row: {
          agent_name: string | null
          ai_generated: boolean
          call_session_id: string
          created_at: string
          feedback: string | null
          id: string
          max_total: number | null
          reviewer_email: string | null
          reviewer_id: string | null
          status: string
          template_id: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          ai_generated?: boolean
          call_session_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          max_total?: number | null
          reviewer_email?: string | null
          reviewer_id?: string | null
          status?: string
          template_id: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          ai_generated?: boolean
          call_session_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          max_total?: number | null
          reviewer_email?: string | null
          reviewer_id?: string | null
          status?: string
          template_id?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_scorecards_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_scorecards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "scorecard_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          agent_name: string | null
          caller_name: string | null
          caller_phone: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          hold_count: number | null
          hold_time_seconds: number | null
          id: string
          started_at: string
          status: string | null
        }
        Insert: {
          agent_name?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          hold_count?: number | null
          hold_time_seconds?: number | null
          id?: string
          started_at?: string
          status?: string | null
        }
        Update: {
          agent_name?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          hold_count?: number | null
          hold_time_seconds?: number | null
          id?: string
          started_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      call_summaries: {
        Row: {
          agent_performance_score: number | null
          call_session_id: string
          created_at: string
          customer_satisfaction: number | null
          id: string
          main_topics: string[] | null
          next_steps: string[] | null
          overall_sentiment: string | null
          summary: string | null
        }
        Insert: {
          agent_performance_score?: number | null
          call_session_id: string
          created_at?: string
          customer_satisfaction?: number | null
          id?: string
          main_topics?: string[] | null
          next_steps?: string[] | null
          overall_sentiment?: string | null
          summary?: string | null
        }
        Update: {
          agent_performance_score?: number | null
          call_session_id?: string
          created_at?: string
          customer_satisfaction?: number | null
          id?: string
          main_topics?: string[] | null
          next_steps?: string[] | null
          overall_sentiment?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_summaries_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcriptions: {
        Row: {
          call_session_id: string
          created_at: string
          end_time: number | null
          id: string
          speaker: string
          start_time: number | null
          text: string
        }
        Insert: {
          call_session_id: string
          created_at?: string
          end_time?: number | null
          id?: string
          speaker: string
          start_time?: number | null
          text: string
        }
        Update: {
          call_session_id?: string
          created_at?: string
          end_time?: number | null
          id?: string
          speaker?: string
          start_time?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcriptions_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcripts_searchable: {
        Row: {
          agent_name: string | null
          call_session_id: string
          created_at: string
          duration_seconds: number | null
          full_text: string
          id: string
          search_vector: unknown
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          call_session_id: string
          created_at?: string
          duration_seconds?: number | null
          full_text: string
          id?: string
          search_vector?: unknown
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          call_session_id?: string
          created_at?: string
          duration_seconds?: number | null
          full_text?: string
          id?: string
          search_vector?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_searchable_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: true
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      calling_hours_config: {
        Row: {
          created_at: string
          holidays_allowed: boolean
          id: string
          is_active: boolean
          region_code: string
          region_name: string
          saturday_end: string | null
          saturday_start: string | null
          sunday_allowed: boolean
          sunday_end: string | null
          sunday_start: string | null
          timezone: string
          updated_at: string
          weekday_end: string
          weekday_start: string
        }
        Insert: {
          created_at?: string
          holidays_allowed?: boolean
          id?: string
          is_active?: boolean
          region_code: string
          region_name: string
          saturday_end?: string | null
          saturday_start?: string | null
          sunday_allowed?: boolean
          sunday_end?: string | null
          sunday_start?: string | null
          timezone?: string
          updated_at?: string
          weekday_end?: string
          weekday_start?: string
        }
        Update: {
          created_at?: string
          holidays_allowed?: boolean
          id?: string
          is_active?: boolean
          region_code?: string
          region_name?: string
          saturday_end?: string | null
          saturday_start?: string | null
          sunday_allowed?: boolean
          sunday_end?: string | null
          sunday_start?: string | null
          timezone?: string
          updated_at?: string
          weekday_end?: string
          weekday_start?: string
        }
        Relationships: []
      }
      churn_risk_signals: {
        Row: {
          account_id: string
          created_at: string
          description: string
          detected_at: string
          evidence: Json | null
          id: string
          is_active: boolean
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          score_delta: number
          severity: string
          signal_type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description: string
          detected_at?: string
          evidence?: Json | null
          id?: string
          is_active?: boolean
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          score_delta?: number
          severity?: string
          signal_type: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string
          detected_at?: string
          evidence?: Json | null
          id?: string
          is_active?: boolean
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          score_delta?: number
          severity?: string
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_risk_signals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_assignments: {
        Row: {
          agent_name: string
          agent_response: string | null
          assigned_by: string | null
          assigner_name: string | null
          call_session_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          scorecard_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          agent_response?: string | null
          assigned_by?: string | null
          assigner_name?: string | null
          call_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          scorecard_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          agent_response?: string | null
          assigned_by?: string | null
          assigner_name?: string | null
          call_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          scorecard_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_assignments_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_recommendations: {
        Row: {
          action_items: string[] | null
          agent_id: string
          category: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          metrics_snapshot: Json | null
          priority: string
          reviewed_at: string | null
          status: string
          title: string
        }
        Insert: {
          action_items?: string[] | null
          agent_id: string
          category: string
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          metrics_snapshot?: Json | null
          priority?: string
          reviewed_at?: string | null
          status?: string
          title: string
        }
        Update: {
          action_items?: string[] | null
          agent_id?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          metrics_snapshot?: Json | null
          priority?: string
          reviewed_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_recommendations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_timestamps: {
        Row: {
          agent_name: string | null
          call_session_id: string
          category: string | null
          created_at: string
          feedback_type: string
          id: string
          message: string
          severity: string
          timestamp_seconds: number
        }
        Insert: {
          agent_name?: string | null
          call_session_id: string
          category?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          message: string
          severity?: string
          timestamp_seconds?: number
        }
        Update: {
          agent_name?: string | null
          call_session_id?: string
          category?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          severity?: string
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "coaching_timestamps_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      consent_history: {
        Row: {
          consent_given: boolean
          consent_method: string
          consent_text: string | null
          consent_type: string
          contact_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string | null
          phone: string
          recorded_at: string
          recorded_by: string | null
          revoked_at: string | null
          user_agent: string | null
        }
        Insert: {
          consent_given: boolean
          consent_method: string
          consent_text?: string | null
          consent_type: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          phone: string
          recorded_at?: string
          recorded_by?: string | null
          revoked_at?: string | null
          user_agent?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_method?: string
          consent_text?: string | null
          consent_type?: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          phone?: string
          recorded_at?: string
          recorded_by?: string | null
          revoked_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_alerts: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          alert_type: string
          contact_id: string
          created_at: string
          id: string
          is_actioned: boolean
          is_read: boolean
          message: string
          severity: string
          title: string
          trigger_data: Json | null
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          alert_type: string
          contact_id: string
          created_at?: string
          id?: string
          is_actioned?: boolean
          is_read?: boolean
          message: string
          severity?: string
          title: string
          trigger_data?: Json | null
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          alert_type?: string
          contact_id?: string
          created_at?: string
          id?: string
          is_actioned?: boolean
          is_read?: boolean
          message?: string
          severity?: string
          title?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interactions: {
        Row: {
          agent_name: string | null
          call_session_id: string | null
          contact_id: string
          created_at: string
          direction: string | null
          duration_seconds: number | null
          id: string
          interaction_type: string
          metadata: Json | null
          sentiment: string | null
          summary: string | null
          topics: string[] | null
          transcript: string | null
        }
        Insert: {
          agent_name?: string | null
          call_session_id?: string | null
          contact_id: string
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          sentiment?: string | null
          summary?: string | null
          topics?: string[] | null
          transcript?: string | null
        }
        Update: {
          agent_name?: string | null
          call_session_id?: string | null
          contact_id?: string
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          sentiment?: string | null
          summary?: string | null
          topics?: string[] | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string | null
          company: string | null
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          name: string
          notes: string | null
          personality_insights: Json | null
          phone: string | null
          position: string | null
          preferences: Json | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          name: string
          notes?: string | null
          personality_insights?: Json | null
          phone?: string | null
          position?: string | null
          preferences?: Json | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          personality_insights?: Json | null
          phone?: string | null
          position?: string | null
          preferences?: Json | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_journey_stages: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          entry_criteria: Json | null
          exit_criteria: Json | null
          id: string
          is_active: boolean
          stage_key: string
          stage_name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          entry_criteria?: Json | null
          exit_criteria?: Json | null
          id?: string
          is_active?: boolean
          stage_key: string
          stage_name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          entry_criteria?: Json | null
          exit_criteria?: Json | null
          id?: string
          is_active?: boolean
          stage_key?: string
          stage_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_goals: {
        Row: {
          comparison_operator: string
          created_at: string
          critical_threshold: number
          id: string
          is_active: boolean
          metric_type: string
          name: string
          notify_on_critical: boolean
          notify_on_warning: boolean
          target_value: number
          updated_at: string
          warning_threshold: number
        }
        Insert: {
          comparison_operator?: string
          created_at?: string
          critical_threshold: number
          id?: string
          is_active?: boolean
          metric_type: string
          name: string
          notify_on_critical?: boolean
          notify_on_warning?: boolean
          target_value: number
          updated_at?: string
          warning_threshold: number
        }
        Update: {
          comparison_operator?: string
          created_at?: string
          critical_threshold?: number
          id?: string
          is_active?: boolean
          metric_type?: string
          name?: string
          notify_on_critical?: boolean
          notify_on_warning?: boolean
          target_value?: number
          updated_at?: string
          warning_threshold?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          expected_close_date: string | null
          external_id: string | null
          health_factors: Json | null
          health_score: number | null
          health_updated_at: string | null
          id: string
          name: string
          notes: string | null
          owner_agent_name: string | null
          probability: number
          source: string | null
          stage: string
          status: string
          updated_at: string
          value_cents: number
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_close_date?: string | null
          external_id?: string | null
          health_factors?: Json | null
          health_score?: number | null
          health_updated_at?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_agent_name?: string | null
          probability?: number
          source?: string | null
          stage?: string
          status?: string
          updated_at?: string
          value_cents?: number
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_close_date?: string | null
          external_id?: string | null
          health_factors?: Json | null
          health_score?: number | null
          health_updated_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_agent_name?: string | null
          probability?: number
          source?: string | null
          stage?: string
          status?: string
          updated_at?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      dialer_campaigns: {
        Row: {
          call_timeout_seconds: number
          completed_contacts: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          max_concurrent_calls: number
          mode: string
          name: string
          retry_attempts: number
          retry_delay_minutes: number
          status: string
          successful_contacts: number | null
          total_contacts: number | null
          updated_at: string
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          call_timeout_seconds?: number
          completed_contacts?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_concurrent_calls?: number
          mode?: string
          name: string
          retry_attempts?: number
          retry_delay_minutes?: number
          status?: string
          successful_contacts?: number | null
          total_contacts?: number | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          call_timeout_seconds?: number
          completed_contacts?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_concurrent_calls?: number
          mode?: string
          name?: string
          retry_attempts?: number
          retry_delay_minutes?: number
          status?: string
          successful_contacts?: number | null
          total_contacts?: number | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      dialer_queue: {
        Row: {
          assigned_agent: string | null
          attempts: number
          call_duration_seconds: number | null
          campaign_id: string
          contact_id: string | null
          created_at: string
          id: string
          last_attempt_at: string | null
          name: string | null
          next_attempt_at: string | null
          phone: string
          priority: number
          result: string | null
          result_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent?: string | null
          attempts?: number
          call_duration_seconds?: number | null
          campaign_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          name?: string | null
          next_attempt_at?: string | null
          phone: string
          priority?: number
          result?: string | null
          result_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent?: string | null
          attempts?: number
          call_duration_seconds?: number | null
          campaign_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          name?: string | null
          next_attempt_at?: string | null
          phone?: string
          priority?: number
          result?: string | null
          result_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialer_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dialer_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialer_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      dnc_import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicate_records: number
          error_details: Json | null
          failed_records: number
          file_name: string
          id: string
          imported_by: string | null
          imported_records: number
          started_at: string
          status: string
          total_records: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicate_records?: number
          error_details?: Json | null
          failed_records?: number
          file_name: string
          id?: string
          imported_by?: string | null
          imported_records?: number
          started_at?: string
          status?: string
          total_records?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicate_records?: number
          error_details?: Json | null
          failed_records?: number
          file_name?: string
          id?: string
          imported_by?: string | null
          imported_records?: number
          started_at?: string
          status?: string
          total_records?: number
        }
        Relationships: []
      }
      dnc_list: {
        Row: {
          added_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string
          phone_normalized: string
          reason: string
          source: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone: string
          phone_normalized: string
          reason?: string
          source?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string
          phone_normalized?: string
          reason?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      geo_access_logs: {
        Row: {
          action: string
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          id: string
          ip_address: string
          reason: string | null
          region: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          id?: string
          ip_address: string
          reason?: string | null
          region?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          reason?: string | null
          region?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      geo_restrictions: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          restriction_type: string
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          restriction_type: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          restriction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      geo_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          log_blocked_attempts: boolean
          mode: string
          notify_on_block: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          log_blocked_attempts?: boolean
          mode?: string
          notify_on_block?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          log_blocked_attempts?: boolean
          mode?: string
          notify_on_block?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      goal_violations: {
        Row: {
          actual_value: number
          created_at: string
          deviation_percentage: number | null
          goal_id: string
          goal_name: string
          id: string
          metric_type: string
          target_value: number
          threshold_type: string
        }
        Insert: {
          actual_value: number
          created_at?: string
          deviation_percentage?: number | null
          goal_id: string
          goal_name: string
          id?: string
          metric_type: string
          target_value: number
          threshold_type?: string
        }
        Update: {
          actual_value?: number
          created_at?: string
          deviation_percentage?: number | null
          goal_id?: string
          goal_name?: string
          id?: string
          metric_type?: string
          target_value?: number
          threshold_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_violations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "dashboard_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      hold_alert_settings: {
        Row: {
          created_at: string
          critical_threshold_seconds: number
          enabled: boolean
          id: string
          notify_on_critical: boolean
          notify_on_warning: boolean
          updated_at: string
          warning_threshold_seconds: number
        }
        Insert: {
          created_at?: string
          critical_threshold_seconds?: number
          enabled?: boolean
          id?: string
          notify_on_critical?: boolean
          notify_on_warning?: boolean
          updated_at?: string
          warning_threshold_seconds?: number
        }
        Update: {
          created_at?: string
          critical_threshold_seconds?: number
          enabled?: boolean
          id?: string
          notify_on_critical?: boolean
          notify_on_warning?: boolean
          updated_at?: string
          warning_threshold_seconds?: number
        }
        Relationships: []
      }
      hold_events: {
        Row: {
          agent_name: string | null
          call_session_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
        }
        Insert: {
          agent_name?: string | null
          call_session_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
        }
        Update: {
          agent_name?: string | null
          call_session_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hold_events_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          is_national: boolean
          name: string
          recurring: boolean
          region_code: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_national?: boolean
          name: string
          recurring?: boolean
          region_code?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_national?: boolean
          name?: string
          recurring?: boolean
          region_code?: string | null
        }
        Relationships: []
      }
      hot_desking_stations: {
        Row: {
          auto_logout_at: string | null
          checked_in_at: string | null
          created_at: string
          current_user_name: string | null
          equipment: Json
          extension: string | null
          id: string
          is_available: boolean
          location: string | null
          station_name: string
          updated_at: string
        }
        Insert: {
          auto_logout_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          current_user_name?: string | null
          equipment?: Json
          extension?: string | null
          id?: string
          is_available?: boolean
          location?: string | null
          station_name: string
          updated_at?: string
        }
        Update: {
          auto_logout_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          current_user_name?: string | null
          equipment?: Json
          extension?: string | null
          id?: string
          is_available?: boolean
          location?: string | null
          station_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ip_whitelist: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_cidr: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_cidr?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_cidr?: boolean
        }
        Relationships: []
      }
      learning_completions: {
        Row: {
          agent_name: string
          completed_at: string
          id: string
          module_id: string
          notes: string | null
          score: number | null
        }
        Insert: {
          agent_name: string
          completed_at?: string
          id?: string
          module_id: string
          notes?: string | null
          score?: number | null
        }
        Update: {
          agent_name?: string
          completed_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          category: string
          content_body: string | null
          content_type: string
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          duration_minutes: number
          id: string
          is_active: boolean
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content_body?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_body?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_sentiment_snapshots: {
        Row: {
          call_session_id: string
          created_at: string
          emotion: string | null
          id: string
          metadata: Json | null
          score: number | null
          sentiment: string
          timestamp_seconds: number
          urgency: string | null
        }
        Insert: {
          call_session_id: string
          created_at?: string
          emotion?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          sentiment: string
          timestamp_seconds?: number
          urgency?: string | null
        }
        Update: {
          call_session_id?: string
          created_at?: string
          emotion?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          sentiment?: string
          timestamp_seconds?: number
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sentiment_snapshots_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      manager_alerts: {
        Row: {
          agent_name: string | null
          alert_type: string
          call_session_id: string | null
          created_at: string
          id: string
          is_resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          sentiment_score: number | null
          severity: string
          trigger_reason: string
        }
        Insert: {
          agent_name?: string | null
          alert_type?: string
          call_session_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          sentiment_score?: number | null
          severity?: string
          trigger_reason: string
        }
        Update: {
          agent_name?: string | null
          alert_type?: string
          call_session_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          sentiment_score?: number | null
          severity?: string
          trigger_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_alerts_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          categories: Json
          created_at: string
          digest_enabled: boolean
          digest_frequency: string
          email_enabled: boolean
          id: string
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          digest_enabled?: boolean
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          created_at?: string
          digest_enabled?: boolean
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string
          created_at: string
          expires_at: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          read_at: string | null
          severity: string
          source_id: string | null
          source_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          read_at?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          read_at?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      number_porting_requests: {
        Row: {
          account_number: string | null
          authorized_name: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_provider: string
          estimated_completion: string | null
          id: string
          notes: string | null
          phone_number: string
          rejection_reason: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          authorized_name: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_provider: string
          estimated_completion?: string | null
          id?: string
          notes?: string | null
          phone_number: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          authorized_name?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_provider?: string
          estimated_completion?: string | null
          id?: string
          notes?: string | null
          phone_number?: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_email: string | null
          status: string
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_email?: string | null
          status?: string
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_email?: string | null
          status?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          added_by: string | null
          call_session_id: string
          created_at: string
          display_order: number
          id: string
          notes: string | null
          playlist_id: string
        }
        Insert: {
          added_by?: string | null
          call_session_id: string
          created_at?: string
          display_order?: number
          id?: string
          notes?: string | null
          playlist_id: string
        }
        Update: {
          added_by?: string | null
          call_session_id?: string
          created_at?: string
          display_order?: number
          id?: string
          notes?: string | null
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "call_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_metrics_settings: {
        Row: {
          abandonment_rate_critical: number
          abandonment_rate_warning: number
          avg_wait_time_critical: number
          avg_wait_time_warning: number
          check_interval_minutes: number
          created_at: string
          enabled: boolean
          id: string
          service_level_critical: number
          service_level_warning: number
          updated_at: string
        }
        Insert: {
          abandonment_rate_critical?: number
          abandonment_rate_warning?: number
          avg_wait_time_critical?: number
          avg_wait_time_warning?: number
          check_interval_minutes?: number
          created_at?: string
          enabled?: boolean
          id?: string
          service_level_critical?: number
          service_level_warning?: number
          updated_at?: string
        }
        Update: {
          abandonment_rate_critical?: number
          abandonment_rate_warning?: number
          avg_wait_time_critical?: number
          avg_wait_time_warning?: number
          check_interval_minutes?: number
          created_at?: string
          enabled?: boolean
          id?: string
          service_level_critical?: number
          service_level_warning?: number
          updated_at?: string
        }
        Relationships: []
      }
      queue_skill_requirements: {
        Row: {
          created_at: string
          id: string
          min_proficiency: number
          queue_name: string
          skill_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          min_proficiency?: number
          queue_name: string
          skill_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          min_proficiency?: number
          queue_name?: string
          skill_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_skill_requirements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_alerts: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          is_resolved: boolean | null
          request_count: number
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          threshold: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          is_resolved?: boolean | null
          request_count: number
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          threshold: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          is_resolved?: boolean | null
          request_count?: number
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          threshold?: number
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          block_reason: string | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          is_blocked: boolean | null
          request_count: number | null
          user_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          block_reason?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          request_count?: number | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          block_reason?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          request_count?: number | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_settings: {
        Row: {
          block_duration_seconds: number | null
          created_at: string | null
          endpoint_pattern: string
          id: string
          is_enabled: boolean | null
          max_requests: number | null
          updated_at: string | null
          window_seconds: number | null
        }
        Insert: {
          block_duration_seconds?: number | null
          created_at?: string | null
          endpoint_pattern: string
          id?: string
          is_enabled?: boolean | null
          max_requests?: number | null
          updated_at?: string | null
          window_seconds?: number | null
        }
        Update: {
          block_duration_seconds?: number | null
          created_at?: string | null
          endpoint_pattern?: string
          id?: string
          is_enabled?: boolean | null
          max_requests?: number | null
          updated_at?: string | null
          window_seconds?: number | null
        }
        Relationships: []
      }
      renewals: {
        Row: {
          account_id: string
          closed_at: string | null
          created_at: string
          current_value: number
          due_date: string
          id: string
          loss_reason: string | null
          metadata: Json | null
          notes: string | null
          owner_agent_name: string | null
          probability: number
          proposed_value: number
          renewal_type: string
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          closed_at?: string | null
          created_at?: string
          current_value?: number
          due_date: string
          id?: string
          loss_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          owner_agent_name?: string | null
          probability?: number
          proposed_value?: number
          renewal_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          closed_at?: string | null
          created_at?: string
          current_value?: number
          due_date?: string
          id?: string
          loss_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          owner_agent_name?: string | null
          probability?: number
          proposed_value?: number
          renewal_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_callbacks: {
        Row: {
          assigned_agent: string | null
          caller_name: string
          caller_phone: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          priority: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent?: string | null
          caller_name: string
          caller_phone: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          priority?: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent?: string | null
          caller_name?: string
          caller_phone?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          priority?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_callbacks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_criteria: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          label: string
          max_score: number
          template_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          label: string
          max_score?: number
          template_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          label?: string
          max_score?: number
          template_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_criteria_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "scorecard_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_responses: {
        Row: {
          comment: string | null
          created_at: string
          criterion_id: string
          id: string
          score: number
          scorecard_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          criterion_id: string
          id?: string
          score: number
          scorecard_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          criterion_id?: string
          id?: string
          score?: number
          scorecard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_responses_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "scorecard_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecard_responses_scorecard_id_fkey"
            columns: ["scorecard_id"]
            isOneToOne: false
            referencedRelation: "call_scorecards"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          is_resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_user_email: string | null
          source_user_id: string | null
          title: string
          trigger_data: Json | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_user_email?: string | null
          source_user_id?: string | null
          title: string
          trigger_data?: Json | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_user_email?: string | null
          source_user_id?: string | null
          title?: string
          trigger_data?: Json | null
        }
        Relationships: []
      }
      shift_templates: {
        Row: {
          break_minutes: number
          color: string | null
          created_at: string
          created_by: string | null
          days_of_week: number[]
          end_time: string
          id: string
          is_active: boolean
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          color?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          color?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      success_plan_milestones: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          display_order: number
          due_date: string | null
          id: string
          metadata: Json | null
          status: string
          success_plan_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          success_plan_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          success_plan_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_plan_milestones_success_plan_id_fkey"
            columns: ["success_plan_id"]
            isOneToOne: false
            referencedRelation: "success_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      success_plans: {
        Row: {
          account_id: string
          business_outcome: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          objective: string
          owner_agent_name: string | null
          progress_percent: number | null
          stakeholders: Json | null
          start_date: string
          status: string
          target_date: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          business_outcome?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          objective: string
          owner_agent_name?: string | null
          progress_percent?: number | null
          stakeholders?: Json | null
          start_date?: string
          status?: string
          target_date: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          business_outcome?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          objective?: string
          owner_agent_name?: string | null
          progress_percent?: number | null
          stakeholders?: Json | null
          start_date?: string
          status?: string
          target_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_plans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          account_id: string | null
          answers: Json
          call_session_id: string | null
          category: string | null
          channel: string | null
          contact_id: string | null
          created_at: string
          free_text_feedback: string | null
          id: string
          respondent_email: string | null
          respondent_phone: string | null
          score: number | null
          submitted_at: string
          survey_id: string
        }
        Insert: {
          account_id?: string | null
          answers?: Json
          call_session_id?: string | null
          category?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string
          free_text_feedback?: string | null
          id?: string
          respondent_email?: string | null
          respondent_phone?: string | null
          score?: number | null
          submitted_at?: string
          survey_id: string
        }
        Update: {
          account_id?: string | null
          answers?: Json
          call_session_id?: string | null
          category?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string
          free_text_feedback?: string | null
          id?: string
          respondent_email?: string | null
          respondent_phone?: string | null
          score?: number | null
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          questions: Json
          survey_type: string
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          questions?: Json
          survey_type?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
          survey_type?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          agent_name: string
          created_at: string
          end_date: string
          id: string
          reason: string | null
          request_type: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          request_type?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          request_type?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      toll_free_numbers: {
        Row: {
          assigned_to: string | null
          call_flow_id: string | null
          created_at: string
          friendly_name: string | null
          id: string
          monthly_cost: number | null
          number: string
          provisioned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          call_flow_id?: string | null
          created_at?: string
          friendly_name?: string | null
          id?: string
          monthly_cost?: number | null
          number: string
          provisioned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          call_flow_id?: string | null
          created_at?: string
          friendly_name?: string | null
          id?: string
          monthly_cost?: number | null
          number?: string
          provisioned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toll_free_numbers_call_flow_id_fkey"
            columns: ["call_flow_id"]
            isOneToOne: false
            referencedRelation: "call_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_detections: {
        Row: {
          call_session_id: string | null
          confidence: number
          created_at: string
          first_detected_at: string
          id: string
          last_detected_at: string
          occurrence_count: number
          topic: string
        }
        Insert: {
          call_session_id?: string | null
          confidence?: number
          created_at?: string
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          occurrence_count?: number
          topic: string
        }
        Update: {
          call_session_id?: string | null
          confidence?: number
          created_at?: string
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          occurrence_count?: number
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_detections_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_trends: {
        Row: {
          avg_sentiment: number | null
          calls_affected: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          topic: string
          total_occurrences: number
          trend_direction: string | null
        }
        Insert: {
          avg_sentiment?: number | null
          calls_affected?: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          topic: string
          total_occurrences?: number
          trend_direction?: string | null
        }
        Update: {
          avg_sentiment?: number | null
          calls_affected?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          topic?: string
          total_occurrences?: number
          trend_direction?: string | null
        }
        Relationships: []
      }
      tracker_matches: {
        Row: {
          agent_name: string | null
          call_session_id: string
          created_at: string
          id: string
          matched_keyword: string | null
          quote: string | null
          timestamp_seconds: number | null
          tracker_id: string
        }
        Insert: {
          agent_name?: string | null
          call_session_id: string
          created_at?: string
          id?: string
          matched_keyword?: string | null
          quote?: string | null
          timestamp_seconds?: number | null
          tracker_id: string
        }
        Update: {
          agent_name?: string | null
          call_session_id?: string
          created_at?: string
          id?: string
          matched_keyword?: string | null
          quote?: string | null
          timestamp_seconds?: number | null
          tracker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_matches_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_matches_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "trackers"
            referencedColumns: ["id"]
          },
        ]
      }
      trackers: {
        Row: {
          category: string
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          keywords: string[]
          match_type: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          match_type?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          match_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_allowed_ips: {
        Row: {
          created_at: string
          description: string | null
          id: string
          ip_address: string
          is_cidr: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          ip_address: string
          is_cidr?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string
          is_cidr?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_ip_restrictions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          last_verified_at: string | null
          mfa_enabled: boolean | null
          mfa_method: string | null
          recovery_email: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          recovery_email?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          recovery_email?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_passkeys: {
        Row: {
          backed_up: boolean | null
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          friendly_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          agent_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_conferences: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          host_name: string | null
          id: string
          max_participants: number
          meeting_url: string | null
          participants: Json
          recording_path: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          host_name?: string | null
          id?: string
          max_participants?: number
          meeting_url?: string | null
          participants?: Json
          recording_path?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          host_name?: string | null
          id?: string
          max_participants?: number
          meeting_url?: string | null
          participants?: Json
          recording_path?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      virtual_fax: {
        Row: {
          created_at: string
          created_by: string | null
          direction: string
          error_message: string | null
          file_path: string | null
          from_number: string | null
          id: string
          page_count: number
          received_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          to_number: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          direction?: string
          error_message?: string | null
          file_path?: string | null
          from_number?: string | null
          id?: string
          page_count?: number
          received_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_number: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          direction?: string
          error_message?: string | null
          file_path?: string | null
          from_number?: string | null
          id?: string
          page_count?: number
          received_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_number?: string
        }
        Relationships: []
      }
      voicemail_messages: {
        Row: {
          agent_name: string | null
          audio_file_path: string | null
          caller_name: string | null
          caller_phone: string
          created_at: string
          duration_seconds: number | null
          id: string
          is_read: boolean
          is_urgent: boolean
          read_at: string | null
          transcription: string | null
        }
        Insert: {
          agent_name?: string | null
          audio_file_path?: string | null
          caller_name?: string | null
          caller_phone: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_read?: boolean
          is_urgent?: boolean
          read_at?: string | null
          transcription?: string | null
        }
        Update: {
          agent_name?: string | null
          audio_file_path?: string | null
          caller_name?: string | null
          caller_phone?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_read?: boolean
          is_urgent?: boolean
          read_at?: string | null
          transcription?: string | null
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      whisper_messages: {
        Row: {
          agent_name: string
          call_session_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          supervisor_name: string
        }
        Insert: {
          agent_name: string
          call_session_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          supervisor_name: string
        }
        Update: {
          agent_name?: string
          call_session_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          supervisor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "whisper_messages_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_to_dnc: {
        Args: {
          p_expires_at?: string
          p_notes?: string
          p_phone: string
          p_reason?: string
          p_source?: string
        }
        Returns: string
      }
      can_access_agent_data: {
        Args: { target_agent_name: string }
        Returns: boolean
      }
      check_calling_hours: { Args: { p_region_code?: string }; Returns: Json }
      check_dnc: { Args: { p_phone: string }; Returns: boolean }
      check_ip_allowed: {
        Args: { p_ip_address: string; p_user_id: string }
        Returns: boolean
      }
      check_ip_in_cidr: {
        Args: { p_cidr: string; p_ip: string }
        Returns: boolean
      }
      check_login_lockout: { Args: { p_email: string }; Returns: Json }
      check_rate_limit: {
        Args: { _endpoint: string; _ip_address: string; _user_id?: string }
        Returns: Json
      }
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      get_profile_role: { Args: { _user_id: string }; Returns: string }
      get_user_agent_id: { Args: never; Returns: string }
      get_user_agent_name: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: { _permission_name: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_agent: { Args: { _agent_name: string }; Returns: boolean }
      is_admin_or_supervisor: { Args: never; Returns: boolean }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      record_failed_login: {
        Args: { p_email: string; p_ip_address?: string; p_user_agent?: string }
        Returns: Json
      }
      record_successful_login: {
        Args: { p_email: string; p_ip_address?: string; p_user_agent?: string }
        Returns: undefined
      }
      validate_audit_insert: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "agent" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "agent", "viewer"],
    },
  },
} as const
