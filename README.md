# AI-Powered Todo List with Supabase

A modern, feature-rich todo application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✅ **Task Management**: Create, edit, delete, and organize tasks
- 📅 **Calendar Integration**: View tasks by date with calendar interface
- 🎯 **Priority Levels**: Low, Medium, High, and Urgent priorities
- 📂 **Categories**: Organize tasks by Work, Personal, Health, Finance, Education
- 🤖 **AI Assistant**: Get productivity insights and task suggestions
- 📊 **Analytics Dashboard**: Track your productivity patterns
- 🌙 **Dark Mode**: Beautiful light and dark themes
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🔄 **Real-time Sync**: Powered by Supabase for instant updates

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-todo-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Copy `.env.local.example` to `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - **IMPORTANT**: Run ALL migration scripts in the correct order. Copy and paste each SQL file content into the SQL Editor and execute them one by one:

   **Step 1**: Run `supabase/migrations/20250616125338_billowing_hall.sql`
   ```sql
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
   ```

   **Step 2**: Run `supabase/migrations/20250616132821_frosty_cake.sql`
   ```sql
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
   ```

   **Step 3**: Run `supabase/migrations/20250621032238_tiny_salad.sql`
   ```sql
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
   ```

   **Step 4**: Run `supabase/migrations/20250621044622_bitter_spire.sql`
   ```sql
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
   ```

   **Step 5**: Run `supabase/migrations/20250623084847_warm_temple.sql`
   ```sql
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
   ```

   **CRITICAL**: You must run all 5 migration scripts in the exact order shown above. Each script builds upon the previous ones.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses the following database structure:

### Tasks Table
```sql
CREATE TABLE tasks (
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
  ai_suggestions text[],
  parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  is_recurring_template boolean DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  recurrence_end_date date,
  original_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  completed_at timestamptz
);
```

### User Categories Table
```sql
CREATE TABLE user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  icon text NOT NULL DEFAULT 'folder',
  created_at timestamptz DEFAULT now(),
  user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'
);
```

## Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── ai/               # AI assistant components
│   ├── dashboard/        # Dashboard views
│   ├── layout/           # Layout components
│   ├── tasks/            # Task-related components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── store.ts          # Zustand store
│   ├── supabase.ts       # Supabase client
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── supabase/             # Database migrations
└── public/               # Static assets
```

## Features Overview

### Task Management
- Create tasks with title, description, due date, priority, and category
- Mark tasks as complete/incomplete
- Edit and delete tasks
- Filter tasks by category, priority, and completion status
- Search tasks by title
- Drag and drop task ordering
- Subtasks and recurring tasks support

### Views
- **Today**: Focus on today's tasks and overdue items
- **Upcoming**: Week view with horizontal date navigation
- **Calendar**: Monthly calendar view with task indicators
- **Insights**: Analytics and productivity tracking

### AI Assistant
- Chat interface for task management
- Productivity tips and insights
- Pattern recognition and suggestions
- Natural language task creation

## Troubleshooting

### Database Schema Errors
If you encounter errors like "column does not exist", ensure you have run ALL migration scripts in the correct order. The most common issue is missing the `sort_order` column, which is added in Step 4 above.

### Connection Issues
- Verify your Supabase URL and API key in `.env.local`
- Check that your Supabase project is active
- Ensure RLS policies are properly configured

## Deployment

The app can be deployed to any platform that supports Next.js:

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
- Netlify
- Railway
- Heroku
- Self-hosted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.