"use client";

import { useState } from 'react';
import { useTodoStore } from '@/lib/store';
import { TaskList } from '@/components/tasks/task-list';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Target, TrendingUp, CheckCircle2, Clock, AlertTriangle, Filter } from 'lucide-react';
import { isToday, isPast } from 'date-fns';

export function Dashboard() {
  const { tasks, setFilter, filterBy } = useTodoStore();
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  
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

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value);
    setFilter({ priority: value === 'all' ? null : value });
  };

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

      {/* Compact Progress Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
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

        <Card className="card-modern">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-2">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {overdueTasks.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Overdue
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>

        <Select value={selectedPriority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Low
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                Medium
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                High
              </div>
            </SelectItem>
            <SelectItem value="urgent">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                Urgent
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Task List */}
      <Card className="card-modern">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                Today's Tasks
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {overdueTasks.length > 0 
                  ? `Including ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`
                  : "Focus on what matters today"}
              </p>
            </div>
          </div>
          
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