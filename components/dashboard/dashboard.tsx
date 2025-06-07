"use client";

import { useTodoStore } from '@/lib/store';
import { TaskList } from '@/components/tasks/task-list';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export function Dashboard() {
  const { tasks } = useTodoStore();
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = tasks.filter(t => !t.completed).length;
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Good morning! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let's make today productive and amazing
        </p>
      </div>

      {/* Compact Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completionRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Complete
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completedTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Completed
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-2">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {activeTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Active
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Task List */}
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Your Tasks
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage and organize your work
              </p>
            </div>
          </div>
          <TaskList tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}