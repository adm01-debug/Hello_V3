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
      call_sessions: {
        Row: {
          agent_name: string | null
          caller_name: string | null
          caller_phone: string | null
          contact_id: string | null
          created_at: string
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
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
