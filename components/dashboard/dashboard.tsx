"use client";

import { useTodoStore } from '@/lib/store';
import { TaskList } from '@/components/tasks/task-list';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Target, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const { tasks } = useTodoStore();
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  // Get today's focus tasks
  const focusTasks = [
    "Complete project presentation",
    "Review quarterly reports", 
    "Team sync meeting",
    "Update documentation"
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center py-8">
        <h1 className="text-heading mb-2">Good morning! 👋</h1>
        <p className="text-muted">Let's make today productive and amazing</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-modern overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="8"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-blue-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${completionRate * 3.64} 364`}
                    strokeDashoffset="0"
                    style={{
                      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                      stroke: 'url(#gradient)'
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {completionRate}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-subheading">Progress</span>
              </div>
              <p className="text-muted">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Focus for Today */}
        <Card className="card-modern overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-subheading">Focus for Today</h2>
                <p className="text-muted">Your daily priorities</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Let's hit {focusTasks.length} tasks today. You got this! 💪
            </p>
            <ul className="space-y-3">
              {focusTasks.map((task, index) => (
                <li key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  <span className="text-sm font-medium">{task}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card className="card-modern">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-subheading">Your Tasks</h2>
              <p className="text-muted">Manage and organize your work</p>
            </div>
          </div>
          <TaskList tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}