/*
  # Add sort_order column to tasks table

  1. Changes
    - Add `sort_order` column to `tasks` table with default value
    - Update existing records to have sequential sort_order values
  
  2. Security
    - No RLS changes needed as this is just adding a column
*/

-- Add sort_order column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sort_order integer DEFAULT 0;
    
    -- Update existing records with sequential sort_order values
    WITH ordered_tasks AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
      FROM tasks
    )
    UPDATE tasks 
    SET sort_order = ordered_tasks.rn
    FROM ordered_tasks
    WHERE tasks.id = ordered_tasks.id;
  END IF;
END $$;