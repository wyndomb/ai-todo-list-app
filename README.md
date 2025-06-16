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
   - Run the migration script from `supabase/migrations/create_tasks_table.sql`

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses a single `tasks` table with the following structure:

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
  ai_suggestions text[]
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