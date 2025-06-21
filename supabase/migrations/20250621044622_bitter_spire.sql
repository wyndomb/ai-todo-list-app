/*
  # Add sort_order column to tasks table

  1. New Columns
    - `sort_order` (integer) - For drag and drop ordering of tasks

  2. Updates
    - Add index for better performance on sort_order queries
    - Set default sort_order values for existing tasks
*/

-- Add sort_order column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);

-- Update existing tasks to have sequential sort_order values
UPDATE tasks 
SET sort_order = row_number() OVER (ORDER BY created_at DESC) - 1
WHERE sort_order IS NULL OR sort_order = 0;