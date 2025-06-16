/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `completed` (boolean, default false)
      - `created_at` (timestamp, default now)
      - `due_date` (date, optional)
      - `priority` (enum: low, medium, high, urgent, default medium)
      - `category` (text, optional)
      - `tags` (text array, optional)
      - `ai_generated` (boolean, default false)
      - `ai_suggestions` (text array, optional)

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for public access (since this is a demo app)
*/

-- Create priority enum type
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  due_date date,
  priority priority_level DEFAULT 'medium',
  category text,
  tags text[],
  ai_generated boolean DEFAULT false,
  ai_suggestions text[]
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (demo purposes)
-- In a real app, you would restrict this to authenticated users
CREATE POLICY "Allow all operations on tasks"
  ON tasks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);