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
      award_types: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_info: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          map_embed_url: string | null
          office_hours: string | null
          phone: string | null
          tiktok_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          map_embed_url?: string | null
          office_hours?: string | null
          phone?: string | null
          tiktok_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          map_embed_url?: string | null
          office_hours?: string | null
          phone?: string | null
          tiktok_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          event_date: string | null
          event_name: string | null
          id: string
          image_url: string
          is_featured: boolean
          season_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          image_url: string
          is_featured?: boolean
          season_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean
          season_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
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
      match_awards: {
        Row: {
          award_type_id: string
          created_at: string
          id: string
          match_id: string
          notes: string | null
          player_id: string
        }
        Insert: {
          award_type_id: string
          created_at?: string
          id?: string
          match_id: string
          notes?: string | null
          player_id: string
        }
        Update: {
          award_type_id?: string
          created_at?: string
          id?: string
          match_id?: string
          notes?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_awards_award_type_id_fkey"
            columns: ["award_type_id"]
            isOneToOne: false
            referencedRelation: "award_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_awards_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team_id: string
          away_team_overs: string | null
          away_team_runs: number | null
          away_team_score: string | null
          away_team_wickets: number | null
          created_at: string
          home_team_id: string
          home_team_overs: string | null
          home_team_runs: number | null
          home_team_score: string | null
          home_team_wickets: number | null
          id: string
          dls_applied: boolean
          man_of_match_id: string | null
          match_date: string
          match_number: number
          match_stage: Database["public"]["Enums"]["match_type"] | null
          match_summary: string | null
          result_text: string | null
          overs_per_side: number | null
          super_over_played: boolean
          target_overs: number | null
          target_runs: number | null
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
          away_team_runs?: number | null
          away_team_score?: string | null
          away_team_wickets?: number | null
          created_at?: string
          home_team_id: string
          home_team_overs?: string | null
          home_team_runs?: number | null
          home_team_score?: string | null
          home_team_wickets?: number | null
          id?: string
          dls_applied?: boolean
          man_of_match_id?: string | null
          match_date: string
          match_number: number
          match_stage?: Database["public"]["Enums"]["match_type"] | null
          match_summary?: string | null
          result_text?: string | null
          overs_per_side?: number | null
          super_over_played?: boolean
          target_overs?: number | null
          target_runs?: number | null
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
          away_team_runs?: number | null
          away_team_score?: string | null
          away_team_wickets?: number | null
          created_at?: string
          home_team_id?: string
          home_team_overs?: string | null
          home_team_runs?: number | null
          home_team_score?: string | null
          home_team_wickets?: number | null
          id?: string
          dls_applied?: boolean
          man_of_match_id?: string | null
          match_date?: string
          match_number?: number
          match_stage?: Database["public"]["Enums"]["match_type"] | null
          match_summary?: string | null
          result_text?: string | null
          overs_per_side?: number | null
          super_over_played?: boolean
          target_overs?: number | null
          target_runs?: number | null
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
      match_innings: {
        Row: {
          id: string
          match_id: string
          innings_number: number
          batting_team_id: string
          bowling_team_id: string
          total_runs: number
          wickets: number
          legal_balls: number
          overs_float: number | null
          run_rate: number | null
          target_runs: number | null
          target_overs: number | null
          powerplay_overs: Json | null
          super_over: boolean
          dls_applied: boolean
          dls_par_score: number | null
          dls_target_runs: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          innings_number: number
          batting_team_id: string
          bowling_team_id: string
          total_runs?: number
          wickets?: number
          legal_balls?: number
          overs_float?: number | null
          run_rate?: number | null
          target_runs?: number | null
          target_overs?: number | null
          powerplay_overs?: Json | null
          super_over?: boolean
          dls_applied?: boolean
          dls_par_score?: number | null
          dls_target_runs?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          innings_number?: number
          batting_team_id?: string
          bowling_team_id?: string
          total_runs?: number
          wickets?: number
          legal_balls?: number
          overs_float?: number | null
          run_rate?: number | null
          target_runs?: number | null
          target_overs?: number | null
          powerplay_overs?: Json | null
          super_over?: boolean
          dls_applied?: boolean
          dls_par_score?: number | null
          dls_target_runs?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_innings_batting_team_id_fkey"
            columns: ["batting_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_innings_bowling_team_id_fkey"
            columns: ["bowling_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_innings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      overs_summary: {
        Row: {
          id: string
          innings_id: string
          over_number: number
          bowler_id: string | null
          runs_over: number
          wides: number
          no_balls: number
          byes: number
          leg_byes: number
          wickets_in_over: number
          maiden: boolean
          created_at: string
        }
        Insert: {
          id?: string
          innings_id: string
          over_number: number
          bowler_id?: string | null
          runs_over?: number
          wides?: number
          no_balls?: number
          byes?: number
          leg_byes?: number
          wickets_in_over?: number
          maiden?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          innings_id?: string
          over_number?: number
          bowler_id?: string | null
          runs_over?: number
          wides?: number
          no_balls?: number
          byes?: number
          leg_byes?: number
          wickets_in_over?: number
          maiden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overs_summary_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overs_summary_innings_id_fkey"
            columns: ["innings_id"]
            isOneToOne: false
            referencedRelation: "match_innings"
            referencedColumns: ["id"]
          },
        ]
      }
      balls: {
        Row: {
          id: string
          match_id: string
          innings_id: string
          over_number: number
          ball_number: number
          sequence: number
          batter_id: string | null
          non_striker_id: string | null
          bowler_id: string | null
          runs_batter: number
          runs_extras: number
          extras_type: string | null
          is_legal: boolean
          wicket_type: string | null
          dismissed_batter_id: string | null
          fielder_id: string | null
          runs_off_bat_on_nb: number | null
          commentary: string | null
          is_super_over: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          innings_id: string
          over_number: number
          ball_number: number
          sequence?: number
          batter_id?: string | null
          non_striker_id?: string | null
          bowler_id?: string | null
          runs_batter?: number
          runs_extras?: number
          extras_type?: string | null
          is_legal?: boolean
          wicket_type?: string | null
          dismissed_batter_id?: string | null
          fielder_id?: string | null
          runs_off_bat_on_nb?: number | null
          commentary?: string | null
          is_super_over?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          innings_id?: string
          over_number?: number
          ball_number?: number
          sequence?: number
          batter_id?: string | null
          non_striker_id?: string | null
          bowler_id?: string | null
          runs_batter?: number
          runs_extras?: number
          extras_type?: string | null
          is_legal?: boolean
          wicket_type?: string | null
          dismissed_batter_id?: string | null
          fielder_id?: string | null
          runs_off_bat_on_nb?: number | null
          commentary?: string | null
          is_super_over?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balls_batter_id_fkey"
            columns: ["batter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_dismissed_batter_id_fkey"
            columns: ["dismissed_batter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_fielder_id_fkey"
            columns: ["fielder_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_innings_id_fkey"
            columns: ["innings_id"]
            isOneToOne: false
            referencedRelation: "match_innings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineups: {
        Row: {
          match_id: string
          team_id: string
          player_id: string
          role: string | null
          is_sub: boolean
        }
        Insert: {
          match_id: string
          team_id: string
          player_id: string
          role?: string | null
          is_sub?: boolean
        }
        Update: {
          match_id?: string
          team_id?: string
          player_id?: string
          role?: string | null
          is_sub?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "match_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scorer_locks: {
        Row: {
          match_id: string
          locked_by: string
          locked_at: string
          released: boolean
        }
        Insert: {
          match_id: string
          locked_by: string
          locked_at?: string
          released?: boolean
        }
        Update: {
          match_id?: string
          locked_by?: string
          locked_at?: string
          released?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "scorer_locks_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorer_locks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ball_revisions: {
        Row: {
          id: string
          ball_id: string
          revised_by: string | null
          revised_at: string
          payload: Json | null
          reason: string | null
        }
        Insert: {
          id?: string
          ball_id: string
          revised_by?: string | null
          revised_at?: string
          payload?: Json | null
          reason?: string | null
        }
        Update: {
          id?: string
          ball_id?: string
          revised_by?: string | null
          revised_at?: string
          payload?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ball_revisions_ball_id_fkey"
            columns: ["ball_id"]
            isOneToOne: false
            referencedRelation: "balls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_revisions_revised_by_fkey"
            columns: ["revised_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body_content: string | null
          bottom_content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string | null
          season_id: string | null
          subtitle: string | null
          title: string
          top_content: string | null
          updated_at: string
        }
        Insert: {
          body_content?: string | null
          bottom_content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          season_id?: string | null
          subtitle?: string | null
          title: string
          top_content?: string | null
          updated_at?: string
        }
        Update: {
          body_content?: string | null
          bottom_content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          season_id?: string | null
          subtitle?: string | null
          title?: string
          top_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          business_description: string | null
          business_logo_url: string | null
          business_name: string | null
          business_website: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          business_description?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_website?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          business_description?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_website?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      player_season_registrations: {
        Row: {
          auction_status: string
          base_price: number
          created_at: string
          id: string
          jersey_number: number | null
          player_id: string
          registration_status: string | null
          season_id: string
          sold_price: number | null
          team_id: string | null
          residency_type: string | null
          updated_at: string
        }
        Insert: {
          auction_status?: string
          base_price?: number
          created_at?: string
          id?: string
          jersey_number?: number | null
          player_id: string
          registration_status?: string | null
          season_id: string
          sold_price?: number | null
          team_id?: string | null
          residency_type?: string | null
          updated_at?: string
        }
        Update: {
          auction_status?: string
          base_price?: number
          created_at?: string
          id?: string
          jersey_number?: number | null
          player_id?: string
          registration_status?: string | null
          season_id?: string
          sold_price?: number | null
          team_id?: string | null
          residency_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_season_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_season_registrations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_season_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          balls_faced: number
          batting_order: number | null
          bowler_id: string | null
          catches: number
          created_at: string
          dismissal_other_text: string | null
          dismissal_type: string | null
          fielder_id: string | null
          fours: number
          id: string
          maidens: number
          match_id: string
          overs_bowled: number
          player_id: string
          run_outs: number
          runout_by_id: string | null
          runs_conceded: number
          runs_scored: number
          season_id: string | null
          sixes: number
          stumpings: number
          wickets: number
        }
        Insert: {
          balls_faced?: number
          batting_order?: number | null
          bowler_id?: string | null
          catches?: number
          created_at?: string
          dismissal_other_text?: string | null
          dismissal_type?: string | null
          fielder_id?: string | null
          fours?: number
          id?: string
          maidens?: number
          match_id: string
          overs_bowled?: number
          player_id: string
          run_outs?: number
          runout_by_id?: string | null
          runs_conceded?: number
          runs_scored?: number
          season_id?: string | null
          sixes?: number
          stumpings?: number
          wickets?: number
        }
        Update: {
          balls_faced?: number
          batting_order?: number | null
          bowler_id?: string | null
          catches?: number
          created_at?: string
          dismissal_other_text?: string | null
          dismissal_type?: string | null
          fielder_id?: string | null
          fours?: number
          id?: string
          maidens?: number
          match_id?: string
          overs_bowled?: number
          player_id?: string
          run_outs?: number
          runout_by_id?: string | null
          runs_conceded?: number
          runs_scored?: number
          season_id?: string | null
          sixes?: number
          stumpings?: number
          wickets?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_fielder_id_fkey"
            columns: ["fielder_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "player_stats_runout_by_id_fkey"
            columns: ["runout_by_id"]
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
          original_season_id: string | null
          payment_receipt_url: string | null
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["player_role"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
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
          original_season_id?: string | null
          payment_receipt_url?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
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
          original_season_id?: string | null
          payment_receipt_url?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_season_id_fkey"
            columns: ["original_season_id"]
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
      sponsors: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          season_id: string | null
          tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          season_id?: string | null
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          season_id?: string | null
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      support_club: {
        Row: {
          id: string
          name: string
          logo_url: string
          website_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url: string
          website_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string
          website_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
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
          captain_id: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          manager_name: string | null
          name: string
          owner_id: string | null
          owner_name: string | null
          primary_color: string
          remaining_budget: number
          secondary_color: string
          short_name: string
          updated_at: string
        }
        Insert: {
          budget?: number
          captain_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          manager_name?: string | null
          name: string
          owner_id?: string | null
          owner_name?: string | null
          primary_color?: string
          remaining_budget?: number
          secondary_color?: string
          short_name: string
          updated_at?: string
        }
        Update: {
          budget?: number
          captain_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          manager_name?: string | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          primary_color?: string
          remaining_budget?: number
          secondary_color?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
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
      recalculate_standings: {
        Args: { p_season_id: string }
        Returns: undefined
      }
      claim_scorer_lock: {
        Args: { p_match_id: string; p_user_id: string }
        Returns: undefined
      }
      release_scorer_lock: {
        Args: { p_match_id: string; p_user_id: string }
        Returns: undefined
      }
      append_ball: {
        Args: { p_match_id: string; p_innings_id: string; p_payload: Json }
        Returns: string
      }
      undo_last_ball: {
        Args: { p_match_id: string; p_innings_id: string }
        Returns: undefined
      }
      finalize_innings: {
        Args: { p_match_id: string; p_innings_id: string }
        Returns: undefined
      }
      finalize_match: {
        Args: { p_match_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      match_status: "scheduled" | "upcoming" | "live" | "completed" | "cancelled" | "abandoned"
      match_type: "group" | "eliminator" | "qualifier" | "final"
      player_auction_status: "registered" | "sold" | "unsold" | "hold" | "retained"
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
      match_status: ["scheduled", "upcoming", "live", "completed", "cancelled", "abandoned"],
      match_type: ["group", "eliminator", "qualifier", "final"],
      player_auction_status: ["registered", "sold", "unsold", "hold", "retained"],
      player_role: ["batsman", "bowler", "all_rounder", "wicket_keeper"],
    },
  },
} as const
