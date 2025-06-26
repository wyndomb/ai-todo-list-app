/*
  # Add user authentication support to existing tables

  1. Updates to tasks table
    - Add user_id column to link tasks to authenticated users
    - Update RLS policies to restrict access to user's own tasks
    - Add index for better performance

  2. Updates to user_categories table  
    - Update RLS policies to restrict access to user's own categories
    - Ensure user_id is properly set

  3. Security
    - Enable proper RLS policies for authenticated users only
    - Remove public access policies
*/

-- Add user_id column to tasks table if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on user_categories" ON user_categories;

-- Create new RLS policies for tasks table
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new RLS policies for user_categories table
CREATE POLICY "Users can view own categories"
  ON user_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON user_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON user_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON user_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update existing categories to have a default user_id (for demo purposes)
-- In production, you might want to handle this differently
UPDATE user_categories 
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;