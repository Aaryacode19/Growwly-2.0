export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          profile_visibility: 'public' | 'private'
          show_join_date: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          profile_visibility?: 'public' | 'private'
          show_join_date?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          profile_visibility?: 'public' | 'private'
          show_join_date?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_progress: {
        Row: {
          id: string
          user_id: string
          date: string
          heading: string
          description: string | null
          video_url: string | null
          image_url: string | null
          visibility: 'private' | 'public'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          heading: string
          description?: string | null
          video_url?: string | null
          image_url?: string | null
          visibility?: 'private' | 'public'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          heading?: string
          description?: string | null
          video_url?: string | null
          image_url?: string | null
          visibility?: 'private' | 'public'
          created_at?: string
          updated_at?: string
        }
      }
      community_interactions: {
        Row: {
          id: string
          user_id: string
          progress_id: string
          type: 'like' | 'comment'
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          progress_id: string
          type: 'like' | 'comment'
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          progress_id?: string
          type?: 'like' | 'comment'
          content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
      }
      access_requests: {
        Row: {
          id: string
          email: string
          full_name: string
          reason: string
          company: string | null
          portfolio_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          reason: string
          company?: string | null
          portfolio_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          reason?: string
          company?: string | null
          portfolio_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          created_at?: string
          updated_at?: string
        }
      }
      achievement_types: {
        Row: {
          id: string
          name: string
          title: string
          description: string
          icon: string
          color: string
          criteria: any
          points: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          title: string
          description: string
          icon: string
          color?: string
          criteria: any
          points?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          title?: string
          description?: string
          icon?: string
          color?: string
          criteria?: any
          points?: number
          is_active?: boolean
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type_id: string
          earned_at: string
          progress: any
          is_featured: boolean
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type_id: string
          earned_at?: string
          progress?: any
          is_featured?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type_id?: string
          earned_at?: string
          progress?: any
          is_featured?: boolean
        }
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
  }
}