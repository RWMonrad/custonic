import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          title: string
          description: string
          status: 'draft' | 'active' | 'expired' | 'terminated'
          value: number
          start_date: string
          end_date: string
          client_id: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: 'draft' | 'active' | 'expired' | 'terminated'
          value?: number
          start_date?: string
          end_date?: string
          client_id: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'draft' | 'active' | 'expired' | 'terminated'
          value?: number
          start_date?: string
          end_date?: string
          client_id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string
          company: string
          phone?: string
          address?: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company: string
          phone?: string
          address?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string
          phone?: string
          address?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url?: string
          company?: string
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name?: string
          avatar_url?: string
          company?: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string
          company?: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
