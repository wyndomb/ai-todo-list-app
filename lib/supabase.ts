import { createClient } from '@supabase/supabase-js';

// Use placeholder values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create client if we have real values (not placeholders)
const hasValidConfig = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          completed: boolean;
          created_at: string;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          category: string | null;
          tags: string[] | null;
          ai_generated: boolean | null;
          ai_suggestions: string[] | null;
          parent_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          created_at?: string;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category?: string | null;
          tags?: string[] | null;
          ai_generated?: boolean | null;
          ai_suggestions?: string[] | null;
          parent_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          completed?: boolean;
          created_at?: string;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category?: string | null;
          tags?: string[] | null;
          ai_generated?: boolean | null;
          ai_suggestions?: string[] | null;
          parent_id?: string | null;
        };
      };
    };
  };
}