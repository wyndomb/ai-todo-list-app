/*
  # Add completed_at column to tasks table

  1. New Columns
    - `completed_at` (timestamptz) - Tracks when a task was completed

  2. Updates
    - Add index for better performance on completed_at queries
    - Set completed_at for existing completed tasks to their created_at as fallback
*/

-- Add completed_at column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Update existing completed tasks to have a completed_at timestamp
-- Use created_at as a fallback for existing completed tasks
UPDATE tasks 
SET completed_at = created_at
WHERE completed = true AND completed_at IS NULL;