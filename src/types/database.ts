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
      ad_campaigns: {
        Row: {
          ad_image_url: string | null
          clicks: number
          company_id: string
          cpl_cents: number | null
          created_at: string
          ctr: number | null
          daily_budget_cents: number
          ended_at: string | null
          funnel_id: string | null
          id: string
          impressions: number
          job_id: string | null
          kill_switch_reason: string | null
          kill_switch_triggered: boolean
          last_synced_at: string | null
          leads: number
          lifetime_budget_cents: number | null
          meta_campaign_id: string | null
          name: string
          objective: Database["public"]["Enums"]["meta_ad_objective"]
          sales_program_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["meta_campaign_status"]
          total_spent_cents: number
          updated_at: string
        }
        Insert: {
          ad_image_url?: string | null
          clicks?: number
          company_id: string
          cpl_cents?: number | null
          created_at?: string
          ctr?: number | null
          daily_budget_cents?: number
          ended_at?: string | null
          funnel_id?: string | null
          id?: string
          impressions?: number
          job_id?: string | null
          kill_switch_reason?: string | null
          kill_switch_triggered?: boolean
          last_synced_at?: string | null
          leads?: number
          lifetime_budget_cents?: number | null
          meta_campaign_id?: string | null
          name: string
          objective?: Database["public"]["Enums"]["meta_ad_objective"]
          sales_program_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["meta_campaign_status"]
          total_spent_cents?: number
          updated_at?: string
        }
        Update: {
          ad_image_url?: string | null
          clicks?: number
          company_id?: string
          cpl_cents?: number | null
          created_at?: string
          ctr?: number | null
          daily_budget_cents?: number
          ended_at?: string | null
          funnel_id?: string | null
          id?: string
          impressions?: number
          job_id?: string | null
          kill_switch_reason?: string | null
          kill_switch_triggered?: boolean
          last_synced_at?: string | null
          leads?: number
          lifetime_budget_cents?: number | null
          meta_campaign_id?: string | null
          name?: string
          objective?: Database["public"]["Enums"]["meta_ad_objective"]
          sales_program_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["meta_campaign_status"]
          total_spent_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_sales_program_id_fkey"
            columns: ["sales_program_id"]
            isOneToOne: false
            referencedRelation: "sales_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_leads: {
        Row: {
          ad_campaign_id: string | null
          ad_id: string | null
          ad_set_id: string | null
          applicant_id: string | null
          application_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          imported_at: string
          matched_at: string | null
          meta_form_id: string | null
          meta_lead_id: string | null
          phone: string | null
          raw_field_data: Json | null
          sales_lead_id: string | null
        }
        Insert: {
          ad_campaign_id?: string | null
          ad_id?: string | null
          ad_set_id?: string | null
          applicant_id?: string | null
          application_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          imported_at?: string
          matched_at?: string | null
          meta_form_id?: string | null
          meta_lead_id?: string | null
          phone?: string | null
          raw_field_data?: Json | null
          sales_lead_id?: string | null
        }
        Update: {
          ad_campaign_id?: string | null
          ad_id?: string | null
          ad_set_id?: string | null
          applicant_id?: string | null
          application_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          imported_at?: string
          matched_at?: string | null
          meta_form_id?: string | null
          meta_lead_id?: string | null
          phone?: string | null
          raw_field_data?: Json | null
          sales_lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_leads_ad_campaign_id_fkey"
            columns: ["ad_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_leads_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_leads_ad_set_id_fkey"
            columns: ["ad_set_id"]
            isOneToOne: false
            referencedRelation: "ad_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_leads_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_leads_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_leads_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_performance: {
        Row: {
          clicks: number
          cpc_cents: number | null
          cpl_cents: number | null
          ctr: number | null
          date_start: string
          date_stop: string
          entity_id: string
          entity_type: string
          frequency: number | null
          id: string
          impressions: number
          leads: number
          meta_entity_id: string
          raw_insights: Json | null
          reach: number
          spend_cents: number
          synced_at: string
        }
        Insert: {
          clicks?: number
          cpc_cents?: number | null
          cpl_cents?: number | null
          ctr?: number | null
          date_start: string
          date_stop: string
          entity_id: string
          entity_type: string
          frequency?: number | null
          id?: string
          impressions?: number
          leads?: number
          meta_entity_id: string
          raw_insights?: Json | null
          reach?: number
          spend_cents?: number
          synced_at?: string
        }
        Update: {
          clicks?: number
          cpc_cents?: number | null
          cpl_cents?: number | null
          ctr?: number | null
          date_start?: string
          date_stop?: string
          entity_id?: string
          entity_type?: string
          frequency?: number | null
          id?: string
          impressions?: number
          leads?: number
          meta_entity_id?: string
          raw_insights?: Json | null
          reach?: number
          spend_cents?: number
          synced_at?: string
        }
        Relationships: []
      }
      ad_sets: {
        Row: {
          ad_campaign_id: string
          bid_amount_cents: number | null
          billing_event: string | null
          clicks: number
          cpl_cents: number | null
          created_at: string
          ctr: number | null
          daily_budget_cents: number | null
          id: string
          impressions: number
          last_synced_at: string | null
          leads: number
          meta_adset_id: string | null
          name: string
          optimization_goal: string | null
          performance_score: number | null
          status: Database["public"]["Enums"]["meta_campaign_status"]
          targeting: Json
          updated_at: string
        }
        Insert: {
          ad_campaign_id: string
          bid_amount_cents?: number | null
          billing_event?: string | null
          clicks?: number
          cpl_cents?: number | null
          created_at?: string
          ctr?: number | null
          daily_budget_cents?: number | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          leads?: number
          meta_adset_id?: string | null
          name: string
          optimization_goal?: string | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["meta_campaign_status"]
          targeting?: Json
          updated_at?: string
        }
        Update: {
          ad_campaign_id?: string
          bid_amount_cents?: number | null
          billing_event?: string | null
          clicks?: number
          cpl_cents?: number | null
          created_at?: string
          ctr?: number | null
          daily_budget_cents?: number | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          leads?: number
          meta_adset_id?: string | null
          name?: string
          optimization_goal?: string | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["meta_campaign_status"]
          targeting?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_sets_ad_campaign_id_fkey"
            columns: ["ad_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_campaign_id: string
          ad_set_id: string
          clicks: number
          cpl_cents: number | null
          created_at: string
          creative_insight_id: string | null
          cta_type: string | null
          ctr: number | null
          description: string | null
          destination_url: string | null
          generated_by_ai: boolean
          headline: string
          id: string
          image_hash: string | null
          image_url: string | null
          impressions: number
          last_synced_at: string | null
          leads: number
          meta_ad_id: string | null
          name: string
          performance_score: number | null
          primary_text: string
          status: Database["public"]["Enums"]["meta_campaign_status"]
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          ad_campaign_id: string
          ad_set_id: string
          clicks?: number
          cpl_cents?: number | null
          created_at?: string
          creative_insight_id?: string | null
          cta_type?: string | null
          ctr?: number | null
          description?: string | null
          destination_url?: string | null
          generated_by_ai?: boolean
          headline: string
          id?: string
          image_hash?: string | null
          image_url?: string | null
          impressions?: number
          last_synced_at?: string | null
          leads?: number
          meta_ad_id?: string | null
          name: string
          performance_score?: number | null
          primary_text: string
          status?: Database["public"]["Enums"]["meta_campaign_status"]
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          ad_campaign_id?: string
          ad_set_id?: string
          clicks?: number
          cpl_cents?: number | null
          created_at?: string
          creative_insight_id?: string | null
          cta_type?: string | null
          ctr?: number | null
          description?: string | null
          destination_url?: string | null
          generated_by_ai?: boolean
          headline?: string
          id?: string
          image_hash?: string | null
          image_url?: string | null
          impressions?: number
          last_synced_at?: string | null
          leads?: number
          meta_ad_id?: string | null
          name?: string
          performance_score?: number | null
          primary_text?: string
          status?: Database["public"]["Enums"]["meta_campaign_status"]
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_ad_campaign_id_fkey"
            columns: ["ad_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_ad_set_id_fkey"
            columns: ["ad_set_id"]
            isOneToOne: false
            referencedRelation: "ad_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_creative_insight_id_fkey"
            columns: ["creative_insight_id"]
            isOneToOne: false
            referencedRelation: "creative_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      applicants: {
        Row: {
          consent_given_at: string | null
          consent_version: string | null
          created_at: string
          cv_file_name: string | null
          cv_file_type: string | null
          cv_file_url: string | null
          email: string
          full_name: string
          gdpr_delete_at: string | null
          id: string
          phone: string | null
        }
        Insert: {
          consent_given_at?: string | null
          consent_version?: string | null
          created_at?: string
          cv_file_name?: string | null
          cv_file_type?: string | null
          cv_file_url?: string | null
          email: string
          full_name: string
          gdpr_delete_at?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          consent_given_at?: string | null
          consent_version?: string | null
          created_at?: string
          cv_file_name?: string | null
          cv_file_type?: string | null
          cv_file_url?: string | null
          email?: string
          full_name?: string
          gdpr_delete_at?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applicant_id: string
          applied_at: string
          customer_decision: Database["public"]["Enums"]["customer_decision"]
          funnel_id: string | null
          funnel_responses: Json | null
          id: string
          job_id: string
          next_call_scheduled_at: string | null
          operator_notes: string | null
          overall_score: number | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          rejection_reason: string | null
          score_breakdown: Json | null
          source: Database["public"]["Enums"]["applicant_source"] | null
          updated_at: string
          utm_params: Json | null
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          customer_decision?: Database["public"]["Enums"]["customer_decision"]
          funnel_id?: string | null
          funnel_responses?: Json | null
          id?: string
          job_id: string
          next_call_scheduled_at?: string | null
          operator_notes?: string | null
          overall_score?: number | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          rejection_reason?: string | null
          score_breakdown?: Json | null
          source?: Database["public"]["Enums"]["applicant_source"] | null
          updated_at?: string
          utm_params?: Json | null
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          customer_decision?: Database["public"]["Enums"]["customer_decision"]
          funnel_id?: string | null
          funnel_responses?: Json | null
          id?: string
          job_id?: string
          next_call_scheduled_at?: string | null
          operator_notes?: string | null
          overall_score?: number | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          rejection_reason?: string | null
          score_breakdown?: Json | null
          source?: Database["public"]["Enums"]["applicant_source"] | null
          updated_at?: string
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_analyses: {
        Row: {
          analyzed_at: string
          criteria_scores: Json | null
          id: string
          interview_score: number | null
          key_insights: string[] | null
          model_version: string | null
          recommendation:
            | Database["public"]["Enums"]["call_recommendation"]
            | null
          red_flags: string[] | null
          summary: string | null
          transcript_id: string | null
          voice_call_id: string
        }
        Insert: {
          analyzed_at?: string
          criteria_scores?: Json | null
          id?: string
          interview_score?: number | null
          key_insights?: string[] | null
          model_version?: string | null
          recommendation?:
            | Database["public"]["Enums"]["call_recommendation"]
            | null
          red_flags?: string[] | null
          summary?: string | null
          transcript_id?: string | null
          voice_call_id: string
        }
        Update: {
          analyzed_at?: string
          criteria_scores?: Json | null
          id?: string
          interview_score?: number | null
          key_insights?: string[] | null
          model_version?: string | null
          recommendation?:
            | Database["public"]["Enums"]["call_recommendation"]
            | null
          red_flags?: string[] | null
          summary?: string | null
          transcript_id?: string | null
          voice_call_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_analyses_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_analyses_voice_call_id_fkey"
            columns: ["voice_call_id"]
            isOneToOne: false
            referencedRelation: "voice_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          application_id: string
          cached_data: Json | null
          candidate_id: string | null
          created_at: string | null
          expires_at: string | null
          job_id: string | null
          phone_number: string | null
          resume_url: string
        }
        Insert: {
          application_id: string
          cached_data?: Json | null
          candidate_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          job_id?: string | null
          phone_number?: string | null
          resume_url: string
        }
        Update: {
          application_id?: string
          cached_data?: Json | null
          candidate_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          job_id?: string | null
          phone_number?: string | null
          resume_url?: string
        }
        Relationships: []
      }
      candidate_events: {
        Row: {
          application_id: string | null
          candidate_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string | null
          id: string
        }
        Insert: {
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          billing_plan: Database["public"]["Enums"]["billing_plan"]
          company_size: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_start: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          linkedin_ad_account_id: string | null
          logo_url: string | null
          meta_ad_account_id: string | null
          monthly_budget: number | null
          name: string
          notes: string | null
          primary_color: string | null
          recruiting_goals: string | null
          status: Database["public"]["Enums"]["company_status"]
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_plan?: Database["public"]["Enums"]["billing_plan"]
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          linkedin_ad_account_id?: string | null
          logo_url?: string | null
          meta_ad_account_id?: string | null
          monthly_budget?: number | null
          name: string
          notes?: string | null
          primary_color?: string | null
          recruiting_goals?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_plan?: Database["public"]["Enums"]["billing_plan"]
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          linkedin_ad_account_id?: string | null
          logo_url?: string | null
          meta_ad_account_id?: string | null
          monthly_budget?: number | null
          name?: string
          notes?: string | null
          primary_color?: string | null
          recruiting_goals?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          website?: string | null
        }
        Relationships: []
      }
      creative_insights: {
        Row: {
          avg_cpl_cents: number | null
          avg_ctr: number | null
          avg_performance_score: number | null
          created_at: string
          effectiveness_rank: number | null
          headline_template: string
          hook_type: string
          id: string
          job_category: string
          primary_text_template: string | null
          total_impressions: number
          total_leads: number
          updated_at: string
          usage_count: number
        }
        Insert: {
          avg_cpl_cents?: number | null
          avg_ctr?: number | null
          avg_performance_score?: number | null
          created_at?: string
          effectiveness_rank?: number | null
          headline_template: string
          hook_type: string
          id?: string
          job_category: string
          primary_text_template?: string | null
          total_impressions?: number
          total_leads?: number
          updated_at?: string
          usage_count?: number
        }
        Update: {
          avg_cpl_cents?: number | null
          avg_ctr?: number | null
          avg_performance_score?: number | null
          created_at?: string
          effectiveness_rank?: number | null
          headline_template?: string
          hook_type?: string
          id?: string
          job_category?: string
          primary_text_template?: string | null
          total_impressions?: number
          total_leads?: number
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      cv_analyses: {
        Row: {
          analyzed_at: string
          application_id: string
          gaps: string[] | null
          id: string
          match_score: number | null
          model_version: string | null
          raw_text: string | null
          strengths: string[] | null
          structured_data: Json | null
          summary: string | null
        }
        Insert: {
          analyzed_at?: string
          application_id: string
          gaps?: string[] | null
          id?: string
          match_score?: number | null
          model_version?: string | null
          raw_text?: string | null
          strengths?: string[] | null
          structured_data?: Json | null
          summary?: string | null
        }
        Update: {
          analyzed_at?: string
          application_id?: string
          gaps?: string[] | null
          id?: string
          match_score?: number | null
          model_version?: string | null
          raw_text?: string | null
          strengths?: string[] | null
          structured_data?: Json | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_analyses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string
          device_type: string
          event_type: string
          funnel_id: string
          id: number
          page_order: number | null
          referrer: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string
          event_type: string
          funnel_id: string
          id?: number
          page_order?: number | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          device_type?: string
          event_type?: string
          funnel_id?: string
          id?: number
          page_order?: number | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_pages: {
        Row: {
          blocks: Json | null
          funnel_id: string
          id: string
          is_required: boolean
          options: Json | null
          page_order: number
          page_type: Database["public"]["Enums"]["page_type"]
          question_text: string | null
          selection_type: Database["public"]["Enums"]["selection_type"] | null
          settings: Json | null
        }
        Insert: {
          blocks?: Json | null
          funnel_id: string
          id?: string
          is_required?: boolean
          options?: Json | null
          page_order: number
          page_type?: Database["public"]["Enums"]["page_type"]
          question_text?: string | null
          selection_type?: Database["public"]["Enums"]["selection_type"] | null
          settings?: Json | null
        }
        Update: {
          blocks?: Json | null
          funnel_id?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          page_order?: number
          page_type?: Database["public"]["Enums"]["page_type"]
          question_text?: string | null
          selection_type?: Database["public"]["Enums"]["selection_type"] | null
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_pages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_templates: {
        Row: {
          category: string
          consent_text: string | null
          created_at: string
          default_branding: Json
          description: string | null
          id: string
          intro_headline: string | null
          intro_subtext: string | null
          is_built_in: boolean
          name: string
          niche: string
          pages: Json
          preview_image_url: string | null
          slug: string
        }
        Insert: {
          category: string
          consent_text?: string | null
          created_at?: string
          default_branding?: Json
          description?: string | null
          id?: string
          intro_headline?: string | null
          intro_subtext?: string | null
          is_built_in?: boolean
          name: string
          niche: string
          pages: Json
          preview_image_url?: string | null
          slug: string
        }
        Update: {
          category?: string
          consent_text?: string | null
          created_at?: string
          default_branding?: Json
          description?: string | null
          id?: string
          intro_headline?: string | null
          intro_subtext?: string | null
          is_built_in?: boolean
          name?: string
          niche?: string
          pages?: Json
          preview_image_url?: string | null
          slug?: string
        }
        Relationships: []
      }
      funnels: {
        Row: {
          branding: Json | null
          consent_text: string | null
          created_at: string
          external_url: string | null
          funnel_type: string
          id: string
          intro_headline: string | null
          intro_image_url: string | null
          intro_subtext: string | null
          job_id: string | null
          name: string
          published_at: string | null
          sales_program_id: string | null
          slug: string
          status: Database["public"]["Enums"]["funnel_status"]
          submissions: number
          thank_you_text: string | null
          views: number
        }
        Insert: {
          branding?: Json | null
          consent_text?: string | null
          created_at?: string
          external_url?: string | null
          funnel_type?: string
          id?: string
          intro_headline?: string | null
          intro_image_url?: string | null
          intro_subtext?: string | null
          job_id?: string | null
          name: string
          published_at?: string | null
          sales_program_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["funnel_status"]
          submissions?: number
          thank_you_text?: string | null
          views?: number
        }
        Update: {
          branding?: Json | null
          consent_text?: string | null
          created_at?: string
          external_url?: string | null
          funnel_type?: string
          id?: string
          intro_headline?: string | null
          intro_image_url?: string | null
          intro_subtext?: string | null
          job_id?: string | null
          name?: string
          published_at?: string | null
          sales_program_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["funnel_status"]
          submissions?: number
          thank_you_text?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnels_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_sales_program_id_fkey"
            columns: ["sales_program_id"]
            isOneToOne: false
            referencedRelation: "sales_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invoice_number: string
          line_items: Json | null
          paid_at: string | null
          pdf_url: string | null
          period_end: string
          period_start: string
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invoice_number: string
          line_items?: Json | null
          paid_at?: string | null
          pdf_url?: string | null
          period_end: string
          period_start: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          line_items?: Json | null
          paid_at?: string | null
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_ad_images: {
        Row: {
          ai_generated: boolean | null
          ai_prompt: string | null
          created_at: string | null
          id: string
          image_hash: string | null
          job_id: string
          label: string | null
          url: string
        }
        Insert: {
          ai_generated?: boolean | null
          ai_prompt?: string | null
          created_at?: string | null
          id?: string
          image_hash?: string | null
          job_id: string
          label?: string | null
          url: string
        }
        Update: {
          ai_generated?: boolean | null
          ai_prompt?: string | null
          created_at?: string | null
          id?: string
          image_hash?: string | null
          job_id?: string
          label?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_ad_images_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_process: string | null
          benefits: string | null
          category: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          daily_budget: number | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          hard_skills: string | null
          id: string
          ideal_candidate: string | null
          interview_questions: string[] | null
          ko_criteria: string | null
          location: string | null
          main_tasks: string | null
          must_qualifications: string | null
          nice_to_have_qualifications: string | null
          requirements: string | null
          salary_range: string | null
          scoring_criteria: Json | null
          selected_ad_image_url: string | null
          soft_skills: string | null
          status: Database["public"]["Enums"]["job_status"]
          target_audience: Json | null
          title: string
        }
        Insert: {
          application_process?: string | null
          benefits?: string | null
          category?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          daily_budget?: number | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          hard_skills?: string | null
          id?: string
          ideal_candidate?: string | null
          interview_questions?: string[] | null
          ko_criteria?: string | null
          location?: string | null
          main_tasks?: string | null
          must_qualifications?: string | null
          nice_to_have_qualifications?: string | null
          requirements?: string | null
          salary_range?: string | null
          scoring_criteria?: Json | null
          selected_ad_image_url?: string | null
          soft_skills?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_audience?: Json | null
          title: string
        }
        Update: {
          application_process?: string | null
          benefits?: string | null
          category?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          daily_budget?: number | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          hard_skills?: string | null
          id?: string
          ideal_candidate?: string | null
          interview_questions?: string[] | null
          ko_criteria?: string | null
          location?: string | null
          main_tasks?: string | null
          must_qualifications?: string | null
          nice_to_have_qualifications?: string | null
          requirements?: string | null
          salary_range?: string | null
          scoring_criteria?: Json | null
          selected_ad_image_url?: string | null
          soft_skills?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_audience?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_log: {
        Row: {
          action: Database["public"]["Enums"]["optimization_action"]
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          triggered_by: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["optimization_action"]
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          triggered_by?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["optimization_action"]
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: Database["public"]["Enums"]["auth_provider"]
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          last_login_at: string | null
          mfa_enabled: boolean
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          company_id?: string | null
          created_at?: string
          email?: string | null
          id: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_call_analyses: {
        Row: {
          analyzed_at: string
          call_rating: number | null
          id: string
          interest_level: string | null
          key_quotes: Json
          meeting_booked: boolean
          meeting_datetime: string | null
          model_version: string | null
          next_action: string | null
          next_action_at: string | null
          objections: Json
          pain_points: Json
          sales_call_id: string
          sentiment: string | null
          structured_data: Json
          summary: string | null
          use_case_analysis: Json | null
        }
        Insert: {
          analyzed_at?: string
          call_rating?: number | null
          id?: string
          interest_level?: string | null
          key_quotes?: Json
          meeting_booked?: boolean
          meeting_datetime?: string | null
          model_version?: string | null
          next_action?: string | null
          next_action_at?: string | null
          objections?: Json
          pain_points?: Json
          sales_call_id: string
          sentiment?: string | null
          structured_data?: Json
          summary?: string | null
          use_case_analysis?: Json | null
        }
        Update: {
          analyzed_at?: string
          call_rating?: number | null
          id?: string
          interest_level?: string | null
          key_quotes?: Json
          meeting_booked?: boolean
          meeting_datetime?: string | null
          model_version?: string | null
          next_action?: string | null
          next_action_at?: string | null
          objections?: Json
          pain_points?: Json
          sales_call_id?: string
          sentiment?: string | null
          structured_data?: Json
          summary?: string | null
          use_case_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_call_analyses_sales_call_id_fkey"
            columns: ["sales_call_id"]
            isOneToOne: true
            referencedRelation: "sales_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_call_sessions: {
        Row: {
          cached_data: Json | null
          created_at: string
          expires_at: string
          phone_number: string | null
          resume_url: string | null
          sales_call_id: string | null
          sales_lead_id: string
        }
        Insert: {
          cached_data?: Json | null
          created_at?: string
          expires_at?: string
          phone_number?: string | null
          resume_url?: string | null
          sales_call_id?: string | null
          sales_lead_id: string
        }
        Update: {
          cached_data?: Json | null
          created_at?: string
          expires_at?: string
          phone_number?: string | null
          resume_url?: string | null
          sales_call_id?: string | null
          sales_lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_call_sessions_sales_call_id_fkey"
            columns: ["sales_call_id"]
            isOneToOne: false
            referencedRelation: "sales_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_call_sessions_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: true
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_calls: {
        Row: {
          created_at: string
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          id: string
          recording_storage_path: string | null
          recording_url: string | null
          sales_lead_id: string
          sales_program_id: string
          started_at: string | null
          status: string
          transcript: Json | null
          twilio_call_sid: string | null
          vapi_call_id: string | null
          vapi_metadata: Json
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          recording_storage_path?: string | null
          recording_url?: string | null
          sales_lead_id: string
          sales_program_id: string
          started_at?: string | null
          status?: string
          transcript?: Json | null
          twilio_call_sid?: string | null
          vapi_call_id?: string | null
          vapi_metadata?: Json
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          recording_storage_path?: string | null
          recording_url?: string | null
          sales_lead_id?: string
          sales_program_id?: string
          started_at?: string | null
          status?: string
          transcript?: Json | null
          twilio_call_sid?: string | null
          vapi_call_id?: string | null
          vapi_metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sales_calls_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_calls_sales_program_id_fkey"
            columns: ["sales_program_id"]
            isOneToOne: false
            referencedRelation: "sales_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_lead_uploads: {
        Row: {
          content_type: string | null
          context_hint: string | null
          created_at: string
          expires_at: string
          file_type: string
          id: string
          sales_call_id: string | null
          sales_lead_id: string
          size_bytes: number | null
          status: string
          storage_path: string | null
          upload_token: string
          uploaded_at: string | null
        }
        Insert: {
          content_type?: string | null
          context_hint?: string | null
          created_at?: string
          expires_at?: string
          file_type: string
          id?: string
          sales_call_id?: string | null
          sales_lead_id: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          upload_token: string
          uploaded_at?: string | null
        }
        Update: {
          content_type?: string | null
          context_hint?: string | null
          created_at?: string
          expires_at?: string
          file_type?: string
          id?: string
          sales_call_id?: string | null
          sales_lead_id?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          upload_token?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_uploads_sales_call_id_fkey"
            columns: ["sales_call_id"]
            isOneToOne: false
            referencedRelation: "sales_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lead_uploads_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          company_name: string | null
          consent_given: boolean
          consent_source: string | null
          consent_timestamp: string | null
          created_at: string
          custom_fields: Json
          email: string | null
          first_name: string | null
          full_name: string | null
          funnel_responses: Json
          id: string
          last_name: string | null
          linkedin_url: string | null
          next_call_scheduled_at: string | null
          notes: string | null
          phone: string
          role: string | null
          sales_program_id: string
          source: string
          source_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          consent_given?: boolean
          consent_source?: string | null
          consent_timestamp?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          funnel_responses?: Json
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          next_call_scheduled_at?: string | null
          notes?: string | null
          phone: string
          role?: string | null
          sales_program_id: string
          source: string
          source_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          consent_given?: boolean
          consent_source?: string | null
          consent_timestamp?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          funnel_responses?: Json
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          next_call_scheduled_at?: string | null
          notes?: string | null
          phone?: string
          role?: string | null
          sales_program_id?: string
          source?: string
          source_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_sales_program_id_fkey"
            columns: ["sales_program_id"]
            isOneToOne: false
            referencedRelation: "sales_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_meetings: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          attendee_phone: string | null
          cal_booking_uid: string
          cal_event_type_slug: string | null
          created_at: string
          end_at: string
          id: string
          notes: string | null
          sales_call_id: string | null
          sales_lead_id: string | null
          sales_program_id: string
          source: string
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          attendee_phone?: string | null
          cal_booking_uid: string
          cal_event_type_slug?: string | null
          created_at?: string
          end_at: string
          id?: string
          notes?: string | null
          sales_call_id?: string | null
          sales_lead_id?: string | null
          sales_program_id: string
          source: string
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          attendee_phone?: string | null
          cal_booking_uid?: string
          cal_event_type_slug?: string | null
          created_at?: string
          end_at?: string
          id?: string
          notes?: string | null
          sales_call_id?: string | null
          sales_lead_id?: string | null
          sales_program_id?: string
          source?: string
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_meetings_sales_call_id_fkey"
            columns: ["sales_call_id"]
            isOneToOne: false
            referencedRelation: "sales_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_meetings_sales_lead_id_fkey"
            columns: ["sales_lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_meetings_sales_program_id_fkey"
            columns: ["sales_program_id"]
            isOneToOne: false
            referencedRelation: "sales_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_offers: {
        Row: {
          active: boolean
          created_at: string
          currency: string | null
          description: string | null
          detail_url: string
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price_cents: number | null
          sales_program_id: string
          summary: string | null
          tags: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string | null
          description?: string | null
          detail_url: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price_cents?: number | null
          sales_program_id: string
          summary?: string | null
          tags?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string | null
          description?: string | null
          detail_url?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price_cents?: number | null
          sales_program_id?: string
          summary?: string | null
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_offers_sales_program_id_fkey"
            columns: ["sales_program_id"]
            isOneToOne: false
            referencedRelation: "sales_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_programs: {
        Row: {
          auto_dial: boolean
          booking_link: string | null
          cal_event_type_slug: string | null
          cal_timezone: string
          cal_username: string | null
          call_strategy: Json
          caller_phone_number: string | null
          company_id: string
          created_at: string
          custom_field_schema: Json
          first_message_override: string | null
          id: string
          meta_form_ids: Json
          name: string
          product_pitch: string | null
          program_type: Database["public"]["Enums"]["sales_program_type"]
          script_guidelines: string | null
          status: string
          system_prompt_override: string | null
          target_persona: string | null
          updated_at: string
          value_proposition: string | null
          vapi_assistant_id: string | null
          vapi_phone_number_id: string | null
        }
        Insert: {
          auto_dial?: boolean
          booking_link?: string | null
          cal_event_type_slug?: string | null
          cal_timezone?: string
          cal_username?: string | null
          call_strategy?: Json
          caller_phone_number?: string | null
          company_id: string
          created_at?: string
          custom_field_schema?: Json
          first_message_override?: string | null
          id?: string
          meta_form_ids?: Json
          name: string
          product_pitch?: string | null
          program_type?: Database["public"]["Enums"]["sales_program_type"]
          script_guidelines?: string | null
          status?: string
          system_prompt_override?: string | null
          target_persona?: string | null
          updated_at?: string
          value_proposition?: string | null
          vapi_assistant_id?: string | null
          vapi_phone_number_id?: string | null
        }
        Update: {
          auto_dial?: boolean
          booking_link?: string | null
          cal_event_type_slug?: string | null
          cal_timezone?: string
          cal_username?: string | null
          call_strategy?: Json
          caller_phone_number?: string | null
          company_id?: string
          created_at?: string
          custom_field_schema?: Json
          first_message_override?: string | null
          id?: string
          meta_form_ids?: Json
          name?: string
          product_pitch?: string | null
          program_type?: Database["public"]["Enums"]["sales_program_type"]
          script_guidelines?: string | null
          status?: string
          system_prompt_override?: string | null
          target_persona?: string | null
          updated_at?: string
          value_proposition?: string | null
          vapi_assistant_id?: string | null
          vapi_phone_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_programs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          full_text: string | null
          id: string
          language: string | null
          model_version: string | null
          segments: Json | null
          transcribed_at: string
          voice_call_id: string
        }
        Insert: {
          full_text?: string | null
          id?: string
          language?: string | null
          model_version?: string | null
          segments?: Json | null
          transcribed_at?: string
          voice_call_id: string
        }
        Update: {
          full_text?: string | null
          id?: string
          language?: string | null
          model_version?: string | null
          segments?: Json | null
          transcribed_at?: string
          voice_call_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_voice_call_id_fkey"
            columns: ["voice_call_id"]
            isOneToOne: false
            referencedRelation: "voice_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_calls: {
        Row: {
          application_id: string
          consent_audio_marker: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          recording_url: string | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          vapi_call_id: string | null
          vapi_metadata: Json | null
        }
        Insert: {
          application_id: string
          consent_audio_marker?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          vapi_call_id?: string | null
          vapi_metadata?: Json | null
        }
        Update: {
          application_id?: string
          consent_audio_marker?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          vapi_call_id?: string | null
          vapi_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      applicant_source:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "direct"
        | "referral"
      auth_provider: "email_password" | "magic_link" | "google_oauth"
      billing_plan: "per_job" | "monthly" | "custom"
      call_recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no"
      call_status:
        | "scheduled"
        | "ringing"
        | "in_progress"
        | "completed"
        | "failed"
        | "no_answer"
      company_status: "active" | "paused" | "churned"
      customer_decision: "pending" | "interested" | "rejected"
      employment_type:
        | "fulltime"
        | "parttime"
        | "minijob"
        | "internship"
        | "freelance"
      funnel_status: "draft" | "active" | "paused" | "archived"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      job_status: "draft" | "active" | "paused" | "closed" | "filled"
      meta_ad_objective:
        | "LEAD_GENERATION"
        | "LINK_CLICKS"
        | "REACH"
        | "BRAND_AWARENESS"
        | "CONVERSIONS"
        | "OUTCOME_LEADS"
        | "OUTCOME_SALES"
        | "OUTCOME_ENGAGEMENT"
        | "OUTCOME_AWARENESS"
        | "OUTCOME_TRAFFIC"
        | "OUTCOME_APP_PROMOTION"
      meta_campaign_status:
        | "PAUSED"
        | "ACTIVE"
        | "ARCHIVED"
        | "DELETED"
        | "IN_PROCESS"
        | "WITH_ISSUES"
      optimization_action:
        | "budget_increased"
        | "budget_decreased"
        | "paused"
        | "reactivated"
        | "creative_rotated"
        | "audience_expanded"
        | "killed"
      page_type:
        | "intro"
        | "question_tiles"
        | "question_images"
        | "contact_form"
        | "loading"
        | "thank_you"
      pipeline_stage:
        | "new"
        | "cv_analyzed"
        | "call_scheduled"
        | "call_completed"
        | "evaluated"
        | "presented"
        | "accepted"
        | "rejected"
      sales_program_type:
        | "generic"
        | "recruiting"
        | "real_estate"
        | "coaching"
        | "ecommerce_highticket"
        | "handwerk"
        | "product_finder"
      selection_type: "single" | "multiple"
      user_role: "admin" | "operator" | "viewer" | "customer"
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
      applicant_source: [
        "facebook",
        "instagram",
        "linkedin",
        "direct",
        "referral",
      ],
      auth_provider: ["email_password", "magic_link", "google_oauth"],
      billing_plan: ["per_job", "monthly", "custom"],
      call_recommendation: ["strong_yes", "yes", "maybe", "no", "strong_no"],
      call_status: [
        "scheduled",
        "ringing",
        "in_progress",
        "completed",
        "failed",
        "no_answer",
      ],
      company_status: ["active", "paused", "churned"],
      customer_decision: ["pending", "interested", "rejected"],
      employment_type: [
        "fulltime",
        "parttime",
        "minijob",
        "internship",
        "freelance",
      ],
      funnel_status: ["draft", "active", "paused", "archived"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      job_status: ["draft", "active", "paused", "closed", "filled"],
      meta_ad_objective: [
        "LEAD_GENERATION",
        "LINK_CLICKS",
        "REACH",
        "BRAND_AWARENESS",
        "CONVERSIONS",
        "OUTCOME_LEADS",
        "OUTCOME_SALES",
        "OUTCOME_ENGAGEMENT",
        "OUTCOME_AWARENESS",
        "OUTCOME_TRAFFIC",
        "OUTCOME_APP_PROMOTION",
      ],
      meta_campaign_status: [
        "PAUSED",
        "ACTIVE",
        "ARCHIVED",
        "DELETED",
        "IN_PROCESS",
        "WITH_ISSUES",
      ],
      optimization_action: [
        "budget_increased",
        "budget_decreased",
        "paused",
        "reactivated",
        "creative_rotated",
        "audience_expanded",
        "killed",
      ],
      page_type: [
        "intro",
        "question_tiles",
        "question_images",
        "contact_form",
        "loading",
        "thank_you",
      ],
      pipeline_stage: [
        "new",
        "cv_analyzed",
        "call_scheduled",
        "call_completed",
        "evaluated",
        "presented",
        "accepted",
        "rejected",
      ],
      sales_program_type: [
        "generic",
        "recruiting",
        "real_estate",
        "coaching",
        "ecommerce_highticket",
        "handwerk",
        "product_finder",
      ],
      selection_type: ["single", "multiple"],
      user_role: ["admin", "operator", "viewer", "customer"],
    },
  },
} as const
