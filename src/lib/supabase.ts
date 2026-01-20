import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Single Supabase client instance
// IMPORTANT: Do not create multiple clients (causes connection issues)
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Type exports for database (placeholder - will be generated later)
export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          storyteller_id: string | null
          status: 'lobby' | 'active' | 'ended'
          phase: string | null
          last_activity: string
          created_at: string
          expires_at: string | null
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          display_name: string
          avatar_id: string | null
          is_storyteller: boolean
          role: 'storyteller' | 'player'
          status: 'alive' | 'dead'
          custom_status: string | null
          is_active: boolean
          sort_order: number
          joined_at: string
          created_at: string
          updated_at: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          recipient_id: string | null
          content: string
          is_broadcast: boolean
          created_at: string
        }
      }
    }
  }
}
