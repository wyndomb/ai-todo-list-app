"use client";

import { useTodoStore } from '@/lib/store';
import { TaskList } from '@/components/tasks/task-list';
import { Card, CardContent } from '@/components/ui/card';
import { Target, CheckCircle2, Clock } from 'lucide-react';

export function Dashboard() {
  const { tasks } = useTodoStore();
  
  // Filter tasks for today and overdue
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => 
    task.dueDate === today
  );
  const overdueTasks = tasks.filter(task => 
    task.dueDate && task.dueDate < today && !task.completed
  );
  
  // Combine today and overdue tasks for display
  const displayTasks = [...overdueTasks, ...todayTasks];
  
  const todayCompletedTasks = todayTasks.filter(t => t.completed).length;
  const todayActiveTasks = todayTasks.filter(t => !t.completed).length;
  const todayCompletionRate = todayTasks.length > 0 
    ? Math.round((todayCompletedTasks / todayTasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in max-w-none pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div className="text-center py-2 md:py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Today's Focus 🌅
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          {todayTasks.length === 0 
            ? "No tasks scheduled for today. Time to plan ahead!" 
            : `${todayActiveTasks} tasks to complete today`}
        </p>
      </div>

      {/* Compact Progress Stats - Single Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="card-modern">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-2">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {todayCompletionRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Today's Progress
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-2">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {todayCompletedTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Completed Today
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {todayActiveTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Remaining Today
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Task List */}
      <Card className="card-modern">
        <CardContent className="p-4 md:p-6">
          <div className="w-full max-w-none">
            {displayTasks.length > 0 ? (
              <TaskList tasks={displayTasks} />
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No tasks for today
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
                  You're all caught up! Time to plan for tomorrow or take a well-deserved break.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}