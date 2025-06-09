"use client";

import { useState } from 'react';
import { useTodoStore } from '@/lib/store';
import { TaskList } from '@/components/tasks/task-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Target, TrendingUp, CheckCircle2, Clock, AlertTriangle, Filter, CalendarIcon, X } from 'lucide-react';
import { isToday, isPast, format } from 'date-fns';

export function Dashboard() {
  const { tasks, categories, setFilter, filterBy } = useTodoStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Filter tasks for today and overdue
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => 
    task.dueDate === today
  );
  const overdueTasks = tasks.filter(task => 
    task.dueDate && task.dueDate < today && !task.completed
  );
  
  // Get dates with tasks for calendar highlighting
  const datesWithTasks = tasks
    .filter(task => task.dueDate)
    .map(task => new Date(task.dueDate!));
  
  // Combine today and overdue tasks for display, but filter by selected date if one is chosen
  let displayTasks = [...overdueTasks, ...todayTasks];
  
  // If a date is selected, filter tasks for that specific date
  if (selectedDate) {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    displayTasks = tasks.filter(task => task.dueDate === selectedDateStr);
  }
  
  const todayCompletedTasks = todayTasks.filter(t => t.completed).length;
  const todayActiveTasks = todayTasks.filter(t => !t.completed).length;
  const todayCompletionRate = todayTasks.length > 0 
    ? Math.round((todayCompletedTasks / todayTasks.length) * 100) 
    : 0;

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setFilter({ category: value === 'all' ? null : value });
  };

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value);
    setFilter({ priority: value === 'all' ? null : value });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFilter({ search: `due:${format(date, 'yyyy-MM-dd')}` });
    } else {
      setFilter({ search: '' });
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setFilter({ search: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {selectedDate && !isToday(selectedDate) 
            ? `Tasks for ${format(selectedDate, 'MMMM d, yyyy')} 📅`
            : "Today's Focus 🌅"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {selectedDate && !isToday(selectedDate)
            ? `${displayTasks.length} task${displayTasks.length === 1 ? '' : 's'} scheduled for this date`
            : todayTasks.length === 0 
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

      {/* Planning Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Mini Calendar */}
        <Card className="card-modern lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Quick Date View
            </CardTitle>
            {selectedDate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearDateFilter}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={{
                hasTasks: datesWithTasks,
              }}
              modifiersStyles={{
                hasTasks: {
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  color: 'hsl(var(--primary))',
                  fontWeight: 'bold',
                },
              }}
              className="rounded-md border-0 w-full"
              classNames={{
                day_today: "bg-primary text-primary-foreground font-bold",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              }}
            />
            {selectedDate && (
              <div className="mt-3 text-center">
                <Badge variant="outline" className="text-xs">
                  {displayTasks.length} task{displayTasks.length === 1 ? '' : 's'} on {format(selectedDate, 'MMM d')}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Filters */}
        <Card className="card-modern lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Category
                </label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Priority
                </label>
                <Select value={selectedPriority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-full">
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
            </div>
          </CardContent>
        </Card>
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
                {selectedDate && !isToday(selectedDate) 
                  ? `Tasks for ${format(selectedDate, 'MMMM d')}`
                  : "Today's Tasks"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDate && !isToday(selectedDate)
                  ? `${displayTasks.length} task${displayTasks.length === 1 ? '' : 's'} scheduled`
                  : overdueTasks.length > 0 
                    ? `Including ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`
                    : "Focus on what matters today"}
              </p>
            </div>
          </div>
          
          {displayTasks.length > 0 ? (
            <TaskList tasks={displayTasks} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {selectedDate && !isToday(selectedDate) 
                  ? "No tasks for this date"
                  : "No tasks for today"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedDate && !isToday(selectedDate)
                  ? "Select a different date or add new tasks for this date."
                  : "You're all caught up! Time to plan for tomorrow or take a well-deserved break."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}