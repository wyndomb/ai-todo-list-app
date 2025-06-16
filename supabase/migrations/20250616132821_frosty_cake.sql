/*
  # Add Recurring Tasks and Subtasks Support

  1. New Columns
    - `parent_id` (uuid) - Links subtasks to their parent tasks
    - `is_recurring_template` (boolean) - Marks a task as a recurring template
    - `recurrence_pattern` (text) - Defines recurrence frequency (daily, weekly, monthly)
    - `recurrence_end_date` (date) - When to stop creating recurring instances
    - `original_task_id` (uuid) - Links generated instances back to their template

  2. Security
    - Maintains existing RLS policies
    - Adds foreign key constraints for data integrity

  3. Indexes
    - Adds indexes for better query performance on new columns
*/

-- Add new columns for subtasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE;

-- Add new columns for recurring tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring_template boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring_template ON tasks(is_recurring_template);
CREATE INDEX IF NOT EXISTS idx_tasks_original_task_id ON tasks(original_task_id);

-- Add constraint to prevent circular references (a task cannot be its own parent)
ALTER TABLE tasks ADD CONSTRAINT check_no_self_parent CHECK (id != parent_id);