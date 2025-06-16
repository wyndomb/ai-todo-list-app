import { createClient } from '@supabase/supabase-js';

// Use fallback values for development to prevent errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only throw error if both are missing and we're not in development
if ((!supabaseUrl || !supabaseAnonKey) && process.env.NODE_ENV === 'production') {
  throw new Error('Missing Supabase environment variables');
}

// Create a mock client if environment variables are missing in development
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
        eq: () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
      }),
    } as any;

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
          is_recurring_template: boolean | null;
          recurrence_pattern: 'daily' | 'weekly' | 'monthly' | null;
          recurrence_end_date: string | null;
          original_task_id: string | null;
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
          is_recurring_template?: boolean | null;
          recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | null;
          recurrence_end_date?: string | null;
          original_task_id?: string | null;
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
          is_recurring_template?: boolean | null;
          recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | null;
          recurrence_end_date?: string | null;
          original_task_id?: string | null;
        };
      };
    };
  };
}