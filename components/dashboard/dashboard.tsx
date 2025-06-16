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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Target, TrendingUp, CheckCircle2, Clock, AlertTriangle, Filter, CalendarIcon, X } from 'lucide-react';
import { isToday, isPast, format } from 'date-fns';

export function Dashboard() {
  const { tasks, categories, setFilter, filterBy } = useTodoStore();
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedQuickDate, setSelectedQuickDate] = useState<Date | undefined>(undefined);
  
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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedQuickDate(date);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      setFilter({ search: `due:${dateStr}` });
    } else {
      setFilter({ search: '' });
    }
  };

  const clearDateFilter = () => {
    setSelectedQuickDate(undefined);
    setFilter({ search: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-none">
      {/* Welcome Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Today's Focus 🌅
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {todayTasks.length === 0 
            ? "No tasks scheduled for today. Time to plan ahead!" 
            : `${todayActiveTasks} tasks to complete today`}
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
              {todayCompletionRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Today's Progress
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {todayCompletedTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Completed Today
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-2">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {todayActiveTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Remaining Today
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {overdueTasks.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Overdue
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>

        <Select value={selectedPriority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[150px]">
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

        {/* Quick Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-[180px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedQuickDate ? (
                format(selectedQuickDate, 'MMM dd, yyyy')
              ) : (
                "Filter by Date"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Select Date</h4>
                {selectedQuickDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Calendar
                mode="single"
                selected={selectedQuickDate}
                onSelect={handleDateSelect}
                className="rounded-md border-0"
                classNames={{
                  day_today: "bg-primary text-primary-foreground font-bold",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                }}
              />
              {selectedQuickDate && (
                <div className="pt-3 border-t mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilter}
                    className="w-full"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Task List */}
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10">
              <CheckCircle2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedQuickDate ? `Tasks for ${format(selectedQuickDate, 'MMMM d, yyyy')}` : "Today's Tasks"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedQuickDate ? (
                  "Viewing tasks for selected date"
                ) : overdueTasks.length > 0 ? (
                  `Including ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`
                ) : (
                  "Focus on what matters today"
                )}
              </p>
            </div>
          </div>
          
          <div className="w-full max-w-none">
            {displayTasks.length > 0 ? (
              <TaskList tasks={displayTasks} />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedQuickDate ? "No tasks for selected date" : "No tasks for today"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedQuickDate ? 
                    "Try selecting a different date or add new tasks." :
                    "You're all caught up! Time to plan for tomorrow or take a well-deserved break."
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}