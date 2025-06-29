import { createClient } from "@supabase/supabase-js";

// Use placeholder values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create client if we have real values and valid URL format
const hasValidConfig = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseUrl.includes(".supabase.co") &&
    supabaseUrl !== "your_supabase_project_url" &&
    supabaseAnonKey !== "your_supabase_anon_key" &&
    supabaseAnonKey.length > 20
);

// Client options to prevent WebSocket issues
const supabaseOptions = {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-my-custom-header": "my-app-name",
    },
  },
};

export const supabase = hasValidConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, supabaseOptions)
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
          completed_at: string | null;
          due_date: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          category: string | null;
          tags: string[] | null;
          ai_generated: boolean | null;
          ai_suggestions: string[] | null;
          parent_id: string | null;
          sort_order: number;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
          due_date?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          category?: string | null;
          tags?: string[] | null;
          ai_generated?: boolean | null;
          ai_suggestions?: string[] | null;
          parent_id?: string | null;
          sort_order?: number;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
          due_date?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          category?: string | null;
          tags?: string[] | null;
          ai_generated?: boolean | null;
          ai_suggestions?: string[] | null;
          parent_id?: string | null;
          sort_order?: number;
          user_id?: string | null;
        };
      };
    };
  };
}
