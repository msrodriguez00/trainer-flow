export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_invitations: {
        Row: {
          accepted: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          status: string
          token: string
          trainer_id: string
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          status?: string
          token: string
          trainer_id: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
          trainer_id?: string
        }
        Relationships: []
      }
      client_trainer_relationships: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_primary: boolean
          trainer_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          trainer_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_trainer_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_trainer_relationships_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar: string | null
          created_at: string
          current_theme_accent_color: string | null
          current_theme_logo_url: string | null
          current_theme_primary_color: string | null
          current_theme_secondary_color: string | null
          current_trainer_id: string | null
          email: string
          id: string
          name: string
          trainer_id: string
          trainers: string[] | null
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          current_theme_accent_color?: string | null
          current_theme_logo_url?: string | null
          current_theme_primary_color?: string | null
          current_theme_secondary_color?: string | null
          current_trainer_id?: string | null
          email: string
          id?: string
          name: string
          trainer_id: string
          trainers?: string[] | null
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          current_theme_accent_color?: string | null
          current_theme_logo_url?: string | null
          current_theme_primary_color?: string | null
          current_theme_secondary_color?: string | null
          current_trainer_id?: string | null
          email?: string
          id?: string
          name?: string
          trainer_id?: string
          trainers?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          comment: string | null
          date: string
          exercise_rating: number | null
          id: string
          plan_exercise_id: string
          repetitions_rating: number | null
          time_rating: number | null
          weight_rating: number | null
        }
        Insert: {
          comment?: string | null
          date?: string
          exercise_rating?: number | null
          id?: string
          plan_exercise_id: string
          repetitions_rating?: number | null
          time_rating?: number | null
          weight_rating?: number | null
        }
        Update: {
          comment?: string | null
          date?: string
          exercise_rating?: number | null
          id?: string
          plan_exercise_id?: string
          repetitions_rating?: number | null
          time_rating?: number | null
          weight_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_plan_exercise_id_fkey"
            columns: ["plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "plan_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          categories: string[]
          created_at: string
          created_by: string
          id: string
          levels: Json
          name: string
        }
        Insert: {
          categories: string[]
          created_at?: string
          created_by: string
          id?: string
          levels?: Json
          name: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          created_by?: string
          id?: string
          levels?: Json
          name?: string
        }
        Relationships: []
      }
      plan_exercises: {
        Row: {
          exercise_id: string
          id: string
          level: number
          plan_id: string
          series_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          level: number
          plan_id: string
          series_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          level?: number
          plan_id?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_exercises_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          client_id: string
          created_at: string
          id: string
          month: string | null
          name: string
          trainer_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          month?: string | null
          name: string
          trainer_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          month?: string | null
          name?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          registration_type: string | null
          role: string | null
          tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          registration_type?: string | null
          role?: string | null
          tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          registration_type?: string | null
          role?: string | null
          tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          order_index: number
          session_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          session_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          order_index: number
          plan_id: string
          scheduled_date: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          plan_id: string
          scheduled_date?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          plan_id?: string
          scheduled_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_brands: {
        Row: {
          accent_color: string | null
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_brands_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_client_invitation: {
        Args: {
          p_invitation_id: string
          p_trainer_id: string
          p_user_id: string
          p_email: string
        }
        Returns: undefined
      }
      get_complete_plan: {
        Args: { p_plan_id: string; p_client_id: string }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: { p_trainer_id: string }
        Returns: Json
      }
      get_plan_id_from_series_id: {
        Args: { p_series_id: string }
        Returns: string
      }
      get_recent_plans_with_clients: {
        Args: { p_trainer_id: string; p_limit?: number }
        Returns: Json
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      migrate_exercises_to_new_structure: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_role: {
        Args: { user_id: string; new_role: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
