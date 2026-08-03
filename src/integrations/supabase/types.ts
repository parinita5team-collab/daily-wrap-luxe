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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_admins: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_time: string
          event_date: string
          event_type: string
          id: string
          location: string
          notes: string
          owner: string
          requirements: string
          start_time: string
          status: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          event_date: string
          event_type?: string
          id?: string
          location?: string
          notes?: string
          owner?: string
          requirements?: string
          start_time?: string
          status?: string
          title: string
          updated_at?: string
          venue?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          event_date?: string
          event_type?: string
          id?: string
          location?: string
          notes?: string
          owner?: string
          requirements?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          accent: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["company_role"]
          updated_at: string
          user_email: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string
          user_email: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          author_email: string
          author_name: string
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          estimated_saving: string
          id: string
          impact: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_email?: string
          author_name?: string
          category?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          estimated_saving?: string
          id?: string
          impact?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_email?: string
          author_name?: string
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          estimated_saving?: string
          id?: string
          impact?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          company_id: string | null
          created_at: string
          enabled: boolean
          id: string
          timeline_time: string
          updated_at: string
          user_id: string
          weekdays_only: boolean
          wrap_time: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          timeline_time?: string
          updated_at?: string
          user_id?: string
          weekdays_only?: boolean
          wrap_time?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          timeline_time?: string
          updated_at?: string
          user_id?: string
          weekdays_only?: boolean
          wrap_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          company_id: string | null
          created_at: string
          date_from: string
          date_to: string
          id: string
          name: string
          query: string
          statuses: string[]
          trackers: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          name: string
          query?: string
          statuses?: string[]
          trackers?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          name?: string
          query?: string
          statuses?: string[]
          trackers?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_entries: {
        Row: {
          company_id: string
          content_today: string
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          metric_value: number | null
          next_steps: string
          notes: string
          owner: string
          platform: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content_today?: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          metric_value?: number | null
          next_steps?: string
          notes?: string
          owner?: string
          platform: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_today?: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          metric_value?: number | null
          next_steps?: string
          notes?: string
          owner?: string
          platform?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          company: string
          company_id: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          project: string
          status: string
          task: string
          team_member: string
          timeline: string
          updated_at: string
        }
        Insert: {
          company?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          project?: string
          status?: string
          task?: string
          team_member: string
          timeline?: string
          updated_at?: string
        }
        Update: {
          company?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          project?: string
          status?: string
          task?: string
          team_member?: string
          timeline?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_company: { Args: { _company_id: string }; Returns: boolean }
      company_role_of: {
        Args: { _company_id: string }
        Returns: Database["public"]["Enums"]["company_role"]
      }
      is_app_admin: { Args: never; Returns: boolean }
      is_company_admin: { Args: { _company_id: string }; Returns: boolean }
    }
    Enums: {
      company_role: "admin" | "editor" | "viewer"
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
      company_role: ["admin", "editor", "viewer"],
    },
  },
} as const
