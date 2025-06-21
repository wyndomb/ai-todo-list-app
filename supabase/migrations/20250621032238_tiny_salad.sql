/*
  # Create user categories table

  1. New Tables
    - `user_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `color` (text, hex color code)
      - `icon` (text, lucide icon name)
      - `created_at` (timestamp, default now)
      - `user_id` (uuid, for future user authentication)

  2. Security
    - Enable RLS on `user_categories` table
    - Add policy for public access (demo purposes)

  3. Default Categories
    - Insert the existing 5 categories as default data
*/

-- Create user_categories table
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  icon text NOT NULL DEFAULT 'folder',
  created_at timestamptz DEFAULT now(),
  user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'
);

-- Enable Row Level Security
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (demo purposes)
CREATE POLICY "Allow all operations on user_categories"
  ON user_categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_name ON user_categories(name);

-- Insert default categories
INSERT INTO user_categories (name, color, icon) VALUES
  ('Work', '#818cf8', 'briefcase'),
  ('Personal', '#22d3ee', 'user'),
  ('Health', '#22c55e', 'heart'),
  ('Finance', '#eab308', 'dollar-sign'),
  ('Education', '#ec4899', 'book-open')
ON CONFLICT DO NOTHING;