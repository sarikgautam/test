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
      live_auction: {
        Row: {
          base_price: number
          bid_history: Json | null
          created_at: string
          current_bid: number
          current_bidding_team_id: string | null
          current_player_id: string | null
          id: string
          increment_amount: number
          is_live: boolean
          season_id: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          bid_history?: Json | null
          created_at?: string
          current_bid?: number
          current_bidding_team_id?: string | null
          current_player_id?: string | null
          id?: string
          increment_amount?: number
          is_live?: boolean
          season_id?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          bid_history?: Json | null
          created_at?: string
          current_bid?: number
          current_bidding_team_id?: string | null
          current_player_id?: string | null
          id?: string
          increment_amount?: number
          is_live?: boolean
          season_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_auction_current_bidding_team_id_fkey"
            columns: ["current_bidding_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_auction_current_player_id_fkey"
            columns: ["current_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_auction_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: true
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team_id: string
          away_team_overs: string | null
          away_team_score: string | null
          created_at: string
          home_team_id: string
          home_team_overs: string | null
          home_team_score: string | null
          id: string
          man_of_match_id: string | null
          match_date: string
          match_number: number
          match_summary: string | null
          season_id: string | null
          status: Database["public"]["Enums"]["match_status"]
          toss_decision: string | null
          toss_winner_id: string | null
          updated_at: string
          venue: string
          winner_team_id: string | null
        }
        Insert: {
          away_team_id: string
          away_team_overs?: string | null
          away_team_score?: string | null
          created_at?: string
          home_team_id: string
          home_team_overs?: string | null
          home_team_score?: string | null
          id?: string
          man_of_match_id?: string | null
          match_date: string
          match_number: number
          match_summary?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          toss_decision?: string | null
          toss_winner_id?: string | null
          updated_at?: string
          venue?: string
          winner_team_id?: string | null
        }
        Update: {
          away_team_id?: string
          away_team_overs?: string | null
          away_team_score?: string | null
          created_at?: string
          home_team_id?: string
          home_team_overs?: string | null
          home_team_score?: string | null
          id?: string
          man_of_match_id?: string | null
          match_date?: string
          match_number?: number
          match_summary?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          toss_decision?: string | null
          toss_winner_id?: string | null
          updated_at?: string
          venue?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_man_of_match_id_fkey"
            columns: ["man_of_match_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_toss_winner_id_fkey"
            columns: ["toss_winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          balls_faced: number
          catches: number
          created_at: string
          fours: number
          id: string
          maidens: number
          match_id: string
          overs_bowled: number
          player_id: string
          run_outs: number
          runs_conceded: number
          runs_scored: number
          season_id: string | null
          sixes: number
          stumpings: number
          wickets: number
        }
        Insert: {
          balls_faced?: number
          catches?: number
          created_at?: string
          fours?: number
          id?: string
          maidens?: number
          match_id: string
          overs_bowled?: number
          player_id: string
          run_outs?: number
          runs_conceded?: number
          runs_scored?: number
          season_id?: string | null
          sixes?: number
          stumpings?: number
          wickets?: number
        }
        Update: {
          balls_faced?: number
          catches?: number
          created_at?: string
          fours?: number
          id?: string
          maidens?: number
          match_id?: string
          overs_bowled?: number
          player_id?: string
          run_outs?: number
          runs_conceded?: number
          runs_scored?: number
          season_id?: string | null
          sixes?: number
          stumpings?: number
          wickets?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          address: string | null
          auction_status: Database["public"]["Enums"]["player_auction_status"]
          base_price: number
          batting_style: string | null
          bowling_style: string | null
          created_at: string
          current_team: string | null
          date_of_birth: string | null
          email: string
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          jersey_number: number | null
          payment_receipt_url: string | null
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["player_role"]
          season_id: string | null
          sold_price: number | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          auction_status?: Database["public"]["Enums"]["player_auction_status"]
          base_price?: number
          batting_style?: string | null
          bowling_style?: string | null
          created_at?: string
          current_team?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          jersey_number?: number | null
          payment_receipt_url?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
          season_id?: string | null
          sold_price?: number | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          auction_status?: Database["public"]["Enums"]["player_auction_status"]
          base_price?: number
          batting_style?: string | null
          bowling_style?: string | null
          created_at?: string
          current_team?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          jersey_number?: number | null
          payment_receipt_url?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
          season_id?: string | null
          sold_price?: number | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          auction_date: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          registration_open: boolean
          start_date: string | null
          updated_at: string
          year: number
        }
        Insert: {
          auction_date?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          registration_open?: boolean
          start_date?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          auction_date?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          registration_open?: boolean
          start_date?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      standings: {
        Row: {
          id: string
          losses: number
          matches_played: number
          net_run_rate: number
          no_results: number
          overs_bowled: number
          overs_faced: number
          points: number
          runs_conceded: number
          runs_scored: number
          season_id: string | null
          team_id: string
          ties: number
          updated_at: string
          wins: number
        }
        Insert: {
          id?: string
          losses?: number
          matches_played?: number
          net_run_rate?: number
          no_results?: number
          overs_bowled?: number
          overs_faced?: number
          points?: number
          runs_conceded?: number
          runs_scored?: number
          season_id?: string | null
          team_id: string
          ties?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          id?: string
          losses?: number
          matches_played?: number
          net_run_rate?: number
          no_results?: number
          overs_bowled?: number
          overs_faced?: number
          points?: number
          runs_conceded?: number
          runs_scored?: number
          season_id?: string | null
          team_id?: string
          ties?: number
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          budget: number
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_name: string | null
          primary_color: string
          remaining_budget: number
          secondary_color: string
          short_name: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_name?: string | null
          primary_color?: string
          remaining_budget?: number
          secondary_color?: string
          short_name: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_name?: string | null
          primary_color?: string
          remaining_budget?: number
          secondary_color?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_settings: {
        Row: {
          auction_date: string | null
          bank_details: string | null
          countdown_description: string | null
          created_at: string
          end_date: string | null
          id: string
          max_players_per_team: number
          min_players_per_team: number
          registration_open: boolean
          season: string
          start_date: string | null
          tournament_name: string
          updated_at: string
        }
        Insert: {
          auction_date?: string | null
          bank_details?: string | null
          countdown_description?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          max_players_per_team?: number
          min_players_per_team?: number
          registration_open?: boolean
          season?: string
          start_date?: string | null
          tournament_name?: string
          updated_at?: string
        }
        Update: {
          auction_date?: string | null
          bank_details?: string | null
          countdown_description?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          max_players_per_team?: number
          min_players_per_team?: number
          registration_open?: boolean
          season?: string
          start_date?: string | null
          tournament_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      match_status: "upcoming" | "live" | "completed" | "cancelled"
      player_auction_status: "registered" | "sold" | "unsold"
      player_role: "batsman" | "bowler" | "all_rounder" | "wicket_keeper"
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
      app_role: ["admin", "moderator", "user"],
      match_status: ["upcoming", "live", "completed", "cancelled"],
      player_auction_status: ["registered", "sold", "unsold"],
      player_role: ["batsman", "bowler", "all_rounder", "wicket_keeper"],
    },
  },
} as const
