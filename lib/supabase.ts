import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client if environment variables are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Using mock client.');
    
    // Return a mock client that doesn't make real requests
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        eq: function() { return this; },
        in: function() { return this; },
        neq: function() { return this; },
        order: function() { return this; },
      }),
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

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