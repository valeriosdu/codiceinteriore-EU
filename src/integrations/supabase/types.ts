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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_customer_merges: {
        Row: {
          created_at: string
          id: string
          merged_by: string | null
          moved_rows: Json
          note: string | null
          primary_email_key: string
          secondary_email_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          merged_by?: string | null
          moved_rows?: Json
          note?: string | null
          primary_email_key: string
          secondary_email_key: string
        }
        Update: {
          created_at?: string
          id?: string
          merged_by?: string | null
          moved_rows?: Json
          note?: string | null
          primary_email_key?: string
          secondary_email_key?: string
        }
        Relationships: []
      }
      ai_generation_metrics: {
        Row: {
          attempt: number
          completion_tokens: number | null
          created_at: string
          duration_ms: number
          error_code: string | null
          function_name: string
          http_status: number | null
          id: string
          model: string | null
          prompt_tokens: number | null
          quiz_session_id: string | null
          success: boolean
          total_tokens: number | null
          transit_cycle_id: string | null
        }
        Insert: {
          attempt?: number
          completion_tokens?: number | null
          created_at?: string
          duration_ms: number
          error_code?: string | null
          function_name: string
          http_status?: number | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          quiz_session_id?: string | null
          success: boolean
          total_tokens?: number | null
          transit_cycle_id?: string | null
        }
        Update: {
          attempt?: number
          completion_tokens?: number | null
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          function_name?: string
          http_status?: number | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          quiz_session_id?: string | null
          success?: boolean
          total_tokens?: number | null
          transit_cycle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_metrics_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      astrology_guide_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          profile_id: string
          quiz_session_id: string
          total_granted: number
          total_used: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          profile_id: string
          quiz_session_id: string
          total_granted?: number
          total_used?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          profile_id?: string
          quiz_session_id?: string
          total_granted?: number
          total_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "astrology_guide_credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "astrology_guide_credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "astrology_guide_credits_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      astrology_guide_questions: {
        Row: {
          answer: string | null
          created_at: string
          email_sent_at: string | null
          error: string | null
          feedback: string | null
          feedback_comment: string | null
          id: string
          is_free: boolean
          model_used: string | null
          processed_at: string | null
          profile_id: string
          question: string
          quiz_session_id: string
          retry_count: number
          scheduled_for: string
          section_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          email_sent_at?: string | null
          error?: string | null
          feedback?: string | null
          feedback_comment?: string | null
          id?: string
          is_free?: boolean
          model_used?: string | null
          processed_at?: string | null
          profile_id: string
          question: string
          quiz_session_id: string
          retry_count?: number
          scheduled_for: string
          section_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          email_sent_at?: string | null
          error?: string | null
          feedback?: string | null
          feedback_comment?: string | null
          id?: string
          is_free?: boolean
          model_used?: string | null
          processed_at?: string | null
          profile_id?: string
          question?: string
          quiz_session_id?: string
          retry_count?: number
          scheduled_for?: string
          section_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "astrology_guide_questions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "astrology_guide_questions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "astrology_guide_questions_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      brevo_sync_log: {
        Row: {
          brevo_contact_id: number | null
          created_at: string
          email: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          status: string
        }
        Insert: {
          brevo_contact_id?: number | null
          created_at?: string
          email: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          status: string
        }
        Update: {
          brevo_contact_id?: number | null
          created_at?: string
          email?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          amount_total: number | null
          claimed_at: string | null
          claimed_profile_id: string | null
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          includes_transits: boolean
          market: string
          meta_purchase_sent_at: string | null
          payment_completed_at: string | null
          payment_provider: string
          payment_status: string
          product_code: string | null
          provider_metadata: Json
          provider_payment_id: string | null
          purchase_type: string
          quiz_session_id: string | null
          recovery_invite_count: number
          recovery_invited_at: string | null
          stripe_session_id: string
          synastry_session_id: string | null
          transit_months: number
          updated_at: string
        }
        Insert: {
          amount_total?: number | null
          claimed_at?: string | null
          claimed_profile_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          includes_transits?: boolean
          market?: string
          meta_purchase_sent_at?: string | null
          payment_completed_at?: string | null
          payment_provider?: string
          payment_status?: string
          product_code?: string | null
          provider_metadata?: Json
          provider_payment_id?: string | null
          purchase_type: string
          quiz_session_id?: string | null
          recovery_invite_count?: number
          recovery_invited_at?: string | null
          stripe_session_id: string
          synastry_session_id?: string | null
          transit_months?: number
          updated_at?: string
        }
        Update: {
          amount_total?: number | null
          claimed_at?: string | null
          claimed_profile_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          includes_transits?: boolean
          market?: string
          meta_purchase_sent_at?: string | null
          payment_completed_at?: string | null
          payment_provider?: string
          payment_status?: string
          product_code?: string | null
          provider_metadata?: Json
          provider_payment_id?: string | null
          purchase_type?: string
          quiz_session_id?: string | null
          recovery_invite_count?: number
          recovery_invited_at?: string | null
          stripe_session_id?: string
          synastry_session_id?: string | null
          transit_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_claimed_profile_id_fkey"
            columns: ["claimed_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "checkout_sessions_claimed_profile_id_fkey"
            columns: ["claimed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_synastry_session_id_fkey"
            columns: ["synastry_session_id"]
            isOneToOne: false
            referencedRelation: "synastry_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          market: string
          message: string
          name: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          market?: string
          message: string
          name: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          market?: string
          message?: string
          name?: string
          reason?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          anonymous_id: string
          created_at: string
          event_name: string
          event_properties: Json
          id: string
          market: string | null
          page_path: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          created_at?: string
          event_name: string
          event_properties?: Json
          id?: string
          market?: string | null
          page_path?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          created_at?: string
          event_name?: string
          event_properties?: Json
          id?: string
          market?: string | null
          page_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          phone: string | null
          quiz_session_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          quiz_session_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          quiz_session_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          attachment_response: string | null
          birth_date: Json | null
          birth_lat: number | null
          birth_lng: number | null
          birth_place: string | null
          birth_time: Json | null
          birth_timezone: number | null
          birth_timezone_iana: string | null
          created_at: string
          focus_area: string | null
          full_report: Json | null
          funnel_slug: string
          id: string
          insights_completed_at: string | null
          insights_started_at: string | null
          language: string
          llm_input: Json | null
          llm_output: Json | null
          market: string
          natal_chart: Json | null
          natal_chart_png: string | null
          natal_chart_svg: string | null
          processing_error: string | null
          processing_status: string
          quiz_answers: Json
          report_attempts: number
          report_started_at: string | null
          teaser_insights: Json | null
          user_name: string | null
        }
        Insert: {
          attachment_response?: string | null
          birth_date?: Json | null
          birth_lat?: number | null
          birth_lng?: number | null
          birth_place?: string | null
          birth_time?: Json | null
          birth_timezone?: number | null
          birth_timezone_iana?: string | null
          created_at?: string
          focus_area?: string | null
          full_report?: Json | null
          funnel_slug?: string
          id?: string
          insights_completed_at?: string | null
          insights_started_at?: string | null
          language?: string
          llm_input?: Json | null
          llm_output?: Json | null
          market?: string
          natal_chart?: Json | null
          natal_chart_png?: string | null
          natal_chart_svg?: string | null
          processing_error?: string | null
          processing_status?: string
          quiz_answers?: Json
          report_attempts?: number
          report_started_at?: string | null
          teaser_insights?: Json | null
          user_name?: string | null
        }
        Update: {
          attachment_response?: string | null
          birth_date?: Json | null
          birth_lat?: number | null
          birth_lng?: number | null
          birth_place?: string | null
          birth_time?: Json | null
          birth_timezone?: number | null
          birth_timezone_iana?: string | null
          created_at?: string
          focus_area?: string | null
          full_report?: Json | null
          funnel_slug?: string
          id?: string
          insights_completed_at?: string | null
          insights_started_at?: string | null
          language?: string
          llm_input?: Json | null
          llm_output?: Json | null
          market?: string
          natal_chart?: Json | null
          natal_chart_png?: string | null
          natal_chart_svg?: string | null
          processing_error?: string | null
          processing_status?: string
          quiz_answers?: Json
          report_attempts?: number
          report_started_at?: string | null
          teaser_insights?: Json | null
          user_name?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          hits: number
          identifier: string
          window_start: string
        }
        Insert: {
          bucket: string
          hits?: number
          identifier: string
          window_start: string
        }
        Update: {
          bucket?: string
          hits?: number
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      report_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          profile_id: string
          quiz_session_id: string
          rating: string
          reasons: string[]
          source: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id: string
          quiz_session_id: string
          rating: string
          reasons?: string[]
          source?: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          quiz_session_id?: string
          rating?: string
          reasons?: string[]
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "report_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_feedback_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_confidence: string | null
          ai_note: string | null
          answered_at: string | null
          answered_by: string | null
          attachment_count: number
          attachments: Json
          body_plain: string | null
          candidate_matches: Json
          category: string | null
          created_at: string
          data_summary: Json | null
          draft_body: string | null
          error: string | null
          flag_for_human: boolean
          force_support: boolean
          from_email: string
          from_name: string | null
          id: string
          manually_linked: boolean
          market: string
          model_used: string | null
          received_at: string | null
          reply_language: string | null
          resolved_email: string | null
          resolved_profile_id: string | null
          retry_count: number
          sent_body: string | null
          status: string
          subject: string | null
          triage_reason: string | null
          updated_at: string
          zoho_account_id: string
          zoho_folder_id: string | null
          zoho_message_id: string
          zoho_sent_message_id: string | null
          zoho_thread_id: string | null
        }
        Insert: {
          ai_confidence?: string | null
          ai_note?: string | null
          answered_at?: string | null
          answered_by?: string | null
          attachment_count?: number
          attachments?: Json
          body_plain?: string | null
          candidate_matches?: Json
          category?: string | null
          created_at?: string
          data_summary?: Json | null
          draft_body?: string | null
          error?: string | null
          flag_for_human?: boolean
          force_support?: boolean
          from_email: string
          from_name?: string | null
          id?: string
          manually_linked?: boolean
          market?: string
          model_used?: string | null
          received_at?: string | null
          reply_language?: string | null
          resolved_email?: string | null
          resolved_profile_id?: string | null
          retry_count?: number
          sent_body?: string | null
          status?: string
          subject?: string | null
          triage_reason?: string | null
          updated_at?: string
          zoho_account_id: string
          zoho_folder_id?: string | null
          zoho_message_id: string
          zoho_sent_message_id?: string | null
          zoho_thread_id?: string | null
        }
        Update: {
          ai_confidence?: string | null
          ai_note?: string | null
          answered_at?: string | null
          answered_by?: string | null
          attachment_count?: number
          attachments?: Json
          body_plain?: string | null
          candidate_matches?: Json
          category?: string | null
          created_at?: string
          data_summary?: Json | null
          draft_body?: string | null
          error?: string | null
          flag_for_human?: boolean
          force_support?: boolean
          from_email?: string
          from_name?: string | null
          id?: string
          manually_linked?: boolean
          market?: string
          model_used?: string | null
          received_at?: string | null
          reply_language?: string | null
          resolved_email?: string | null
          resolved_profile_id?: string | null
          retry_count?: number
          sent_body?: string | null
          status?: string
          subject?: string | null
          triage_reason?: string | null
          updated_at?: string
          zoho_account_id?: string
          zoho_folder_id?: string | null
          zoho_message_id?: string
          zoho_sent_message_id?: string | null
          zoho_thread_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      synastry_sessions: {
        Row: {
          archetype: string | null
          archetype_label: string | null
          bi_wheel_svg: string | null
          brief: Json | null
          chart_a: Json | null
          chart_a_svg: string | null
          chart_b: Json | null
          chart_b_svg: string | null
          client_name: string | null
          created_at: string
          focus_relational: string | null
          full_report: Json | null
          funnel_slug: string
          id: string
          language: string
          llm_input: Json | null
          llm_output: Json | null
          market: string
          person_a_birth_date: Json | null
          person_a_birth_lat: number | null
          person_a_birth_lng: number | null
          person_a_birth_place: string | null
          person_a_birth_time: Json | null
          person_a_birth_timezone: number | null
          person_a_birth_timezone_iana: string | null
          person_a_name: string | null
          person_a_time_known: boolean
          person_b_birth_date: Json | null
          person_b_birth_lat: number | null
          person_b_birth_lng: number | null
          person_b_birth_place: string | null
          person_b_birth_time: Json | null
          person_b_birth_timezone: number | null
          person_b_birth_timezone_iana: string | null
          person_b_name: string | null
          person_b_time_known: boolean
          processing_error: string | null
          processing_status: string | null
          quiz_answers: Json | null
          relationship_duration: string | null
          report_pdf_url: string | null
          score_overall: number | null
          scores: Json | null
          synastry_data: Json | null
          teaser_highlight: Json | null
          updated_at: string
        }
        Insert: {
          archetype?: string | null
          archetype_label?: string | null
          bi_wheel_svg?: string | null
          brief?: Json | null
          chart_a?: Json | null
          chart_a_svg?: string | null
          chart_b?: Json | null
          chart_b_svg?: string | null
          client_name?: string | null
          created_at?: string
          focus_relational?: string | null
          full_report?: Json | null
          funnel_slug?: string
          id?: string
          language?: string
          llm_input?: Json | null
          llm_output?: Json | null
          market?: string
          person_a_birth_date?: Json | null
          person_a_birth_lat?: number | null
          person_a_birth_lng?: number | null
          person_a_birth_place?: string | null
          person_a_birth_time?: Json | null
          person_a_birth_timezone?: number | null
          person_a_birth_timezone_iana?: string | null
          person_a_name?: string | null
          person_a_time_known?: boolean
          person_b_birth_date?: Json | null
          person_b_birth_lat?: number | null
          person_b_birth_lng?: number | null
          person_b_birth_place?: string | null
          person_b_birth_time?: Json | null
          person_b_birth_timezone?: number | null
          person_b_birth_timezone_iana?: string | null
          person_b_name?: string | null
          person_b_time_known?: boolean
          processing_error?: string | null
          processing_status?: string | null
          quiz_answers?: Json | null
          relationship_duration?: string | null
          report_pdf_url?: string | null
          score_overall?: number | null
          scores?: Json | null
          synastry_data?: Json | null
          teaser_highlight?: Json | null
          updated_at?: string
        }
        Update: {
          archetype?: string | null
          archetype_label?: string | null
          bi_wheel_svg?: string | null
          brief?: Json | null
          chart_a?: Json | null
          chart_a_svg?: string | null
          chart_b?: Json | null
          chart_b_svg?: string | null
          client_name?: string | null
          created_at?: string
          focus_relational?: string | null
          full_report?: Json | null
          funnel_slug?: string
          id?: string
          language?: string
          llm_input?: Json | null
          llm_output?: Json | null
          market?: string
          person_a_birth_date?: Json | null
          person_a_birth_lat?: number | null
          person_a_birth_lng?: number | null
          person_a_birth_place?: string | null
          person_a_birth_time?: Json | null
          person_a_birth_timezone?: number | null
          person_a_birth_timezone_iana?: string | null
          person_a_name?: string | null
          person_a_time_known?: boolean
          person_b_birth_date?: Json | null
          person_b_birth_lat?: number | null
          person_b_birth_lng?: number | null
          person_b_birth_place?: string | null
          person_b_birth_time?: Json | null
          person_b_birth_timezone?: number | null
          person_b_birth_timezone_iana?: string | null
          person_b_name?: string | null
          person_b_time_known?: boolean
          processing_error?: string | null
          processing_status?: string | null
          quiz_answers?: Json | null
          relationship_duration?: string | null
          report_pdf_url?: string | null
          score_overall?: number | null
          scores?: Json | null
          synastry_data?: Json | null
          teaser_highlight?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      transit_cycles: {
        Row: {
          created_at: string
          entitlement_id: string
          failure_history: Json
          fetch_status: string
          id: string
          interpretation_status: string
          interpreted_transits: Json | null
          llm_input: Json | null
          period_end: string
          period_start: string
          premium_purchase_at: string | null
          premium_purchase_local_datetime: string | null
          premium_purchase_timezone: string | null
          processing_error: string | null
          profile_id: string
          quiz_session_id: string
          raw_transits: Json | null
          retry_count: number
          snapshot_count: number
          snapshot_step_days: number
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entitlement_id: string
          failure_history?: Json
          fetch_status?: string
          id?: string
          interpretation_status?: string
          interpreted_transits?: Json | null
          llm_input?: Json | null
          period_end: string
          period_start: string
          premium_purchase_at?: string | null
          premium_purchase_local_datetime?: string | null
          premium_purchase_timezone?: string | null
          processing_error?: string | null
          profile_id: string
          quiz_session_id: string
          raw_transits?: Json | null
          retry_count?: number
          snapshot_count?: number
          snapshot_step_days?: number
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entitlement_id?: string
          failure_history?: Json
          fetch_status?: string
          id?: string
          interpretation_status?: string
          interpreted_transits?: Json | null
          llm_input?: Json | null
          period_end?: string
          period_start?: string
          premium_purchase_at?: string | null
          premium_purchase_local_datetime?: string | null
          premium_purchase_timezone?: string | null
          processing_error?: string | null
          profile_id?: string
          quiz_session_id?: string
          raw_transits?: Json | null
          retry_count?: number
          snapshot_count?: number
          snapshot_step_days?: number
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_cycles_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "customer_purchase_overview"
            referencedColumns: ["entitlement_id"]
          },
          {
            foreignKeyName: "transit_cycles_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["monthly_transits_entitlement_id"]
          },
          {
            foreignKeyName: "transit_cycles_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_cycles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transit_cycles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_cycles_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          language: string
          last_invoice_id: string | null
          market: string
          profile_id: string
          quiz_session_id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          language?: string
          last_invoice_id?: string | null
          market?: string
          profile_id: string
          quiz_session_id: string
          status?: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          language?: string
          last_invoice_id?: string | null
          market?: string
          profile_id?: string
          quiz_session_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          created_at: string
          ends_at: string | null
          entitlement_type: string
          id: string
          profile_id: string
          quiz_session_id: string | null
          source: string
          starts_at: string
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          entitlement_type: string
          id?: string
          profile_id: string
          quiz_session_id?: string | null
          source: string
          starts_at?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          entitlement_type?: string
          id?: string
          profile_id?: string
          quiz_session_id?: string | null
          source?: string
          starts_at?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_entitlements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entitlements_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          profile_id: string
          purchase_type: string | null
          quiz_session_id: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          profile_id: string
          purchase_type?: string | null
          quiz_session_id: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          profile_id?: string
          purchase_type?: string | null
          quiz_session_id?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_customer_index: {
        Row: {
          checkouts_paid_count: number | null
          display_email: string | null
          email_key: string | null
          has_orphan_checkout: boolean | null
          has_profile: boolean | null
          last_activity_at: string | null
          lifetime_spend_cents: number | null
          profile_id: string | null
        }
        Relationships: []
      }
      customer_purchase_overview: {
        Row: {
          checkout_created_at: string | null
          customer_email: string | null
          entitlement_ends_at: string | null
          entitlement_id: string | null
          entitlement_starts_at: string | null
          entitlement_status: string | null
          entitlement_type: string | null
          has_interpreted_transits: boolean | null
          has_llm_input: boolean | null
          has_new_transit_llm_input: boolean | null
          has_raw_transits: boolean | null
          includes_transits: boolean | null
          payment_completed_at: string | null
          payment_status: string | null
          product_code: string | null
          profile_id: string | null
          purchase_type: string | null
          quiz_session_id: string | null
          stripe_session_id: string | null
          transit_cycle_id: string | null
          transit_fetch_status: string | null
          transit_interpretation_status: string | null
          transit_months: number | null
          transit_period_end: string | null
          transit_period_start: string | null
          transit_periods_count: number | null
          transit_processing_error: string | null
          transit_status: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_claimed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_report_purchase_overview"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "checkout_sessions_claimed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_report_purchase_overview: {
        Row: {
          birth_place: string | null
          checkout_customer_email: string | null
          checkout_product_code: string | null
          checkout_purchase_type: string | null
          created_at: string | null
          has_full_report: boolean | null
          has_interpreted_transits: boolean | null
          has_llm_input: boolean | null
          has_natal_chart: boolean | null
          has_raw_transits: boolean | null
          includes_transits: boolean | null
          is_active_report: boolean | null
          monthly_transits_ends_at: string | null
          monthly_transits_entitlement_id: string | null
          monthly_transits_starts_at: string | null
          monthly_transits_status: string | null
          natal_entitlement_status: string | null
          payment_status: string | null
          profile_email: string | null
          profile_id: string | null
          quiz_session_id: string | null
          report_label: string | null
          report_purchase_type: string | null
          stripe_session_id: string | null
          transit_cycle_id: string | null
          transit_fetch_status: string | null
          transit_interpretation_status: string | null
          transit_months: number | null
          transit_periods_count: number | null
          transit_processing_error: string | null
          transit_status: string | null
          user_id: string | null
          user_name: string | null
          user_report_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_customer_detail: { Args: { p_email: string }; Returns: Json }
      admin_customers_search: {
        Args: {
          p_filter?: string
          p_hide_empty?: boolean
          p_page?: number
          p_page_size?: number
          p_q?: string
          p_sort?: string
        }
        Returns: Json
      }
      admin_member_emails: { Args: { p_email_key: string }; Returns: string[] }
      admin_merge_customers: {
        Args: {
          p_merged_by?: string
          p_note?: string
          p_primary: string
          p_secondary: string
        }
        Returns: Json
      }
      admin_primary_email: { Args: { p_email_key: string }; Returns: string }
      admin_quiz_sessions_for_email: {
        Args: { p_email_key: string }
        Returns: string[]
      }
      admin_set_vault_secret: {
        Args: { p_name: string; p_value: string }
        Returns: string
      }
      admin_unmerge_customer: { Args: { p_secondary: string }; Returns: Json }
      append_transit_failure: {
        Args: { p_cycle_id: string; p_entry: Json }
        Returns: undefined
      }
      consume_astrology_credit: {
        Args: { p_profile_id: string; p_quiz_session_id: string }
        Returns: boolean
      }
      create_quiz_session: { Args: { p_payload: Json }; Returns: string }
      create_synastry_session: { Args: { p_payload: Json }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_quiz_session_public: {
        Args: { p_session_id: string }
        Returns: {
          id: string
          natal_chart: Json
          natal_chart_svg: string
          processing_status: string
          teaser_insights: Json
          user_name: string
        }[]
      }
      get_synastry_session_public: {
        Args: { p_session_id: string }
        Returns: {
          archetype: string
          archetype_label: string
          bi_wheel_svg: string
          full_report: Json
          id: string
          processing_error: string
          processing_status: string
          score_overall: number
          scores: Json
          teaser_highlight: Json
        }[]
      }
      grant_astrology_credits: {
        Args: {
          p_amount: number
          p_profile_id: string
          p_quiz_session_id: string
        }
        Returns: {
          balance: number
          created_at: string
          id: string
          profile_id: string
          quiz_session_id: string
          total_granted: number
          total_used: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "astrology_guide_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      rate_limit_check: {
        Args: {
          p_bucket: string
          p_identifier: string
          p_max: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      resolve_email_key: { Args: { p_email: string }; Returns: string }
      restore_astrology_credit: {
        Args: { p_profile_id: string; p_quiz_session_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_owns_quiz_session: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      user_owns_synastry_session: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      watchdog_collect: { Args: never; Returns: Json }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
