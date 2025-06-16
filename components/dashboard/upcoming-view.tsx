"use client";

import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { useTodoStore } from '@/lib/store';
import { TaskList } from '@/components/tasks/task-list';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  ListTodo 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpcomingView() {
  const { tasks } = useTodoStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Generate 7 days starting from weekStartDate
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  }, [weekStartDate]);

  // Get tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tasks.filter(task => task.dueDate === dateStr);
  }, [tasks, selectedDate]);

  // Get task counts for each day in the week
  const dayTaskCounts = useMemo(() => {
    return weekDays.reduce((acc, day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      acc[dateStr] = tasks.filter(task => task.dueDate === dateStr && !task.completed).length;
      return acc;
    }, {} as Record<string, number>);
  }, [weekDays, tasks]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = addDays(weekStartDate, direction === 'next' ? 7 : -7);
    setWeekStartDate(newWeekStart);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setWeekStartDate(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setWeekStartDate(startOfWeek(date, { weekStartsOn: 1 }));
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Upcoming
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Plan and manage your future tasks
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          {/* Month/Year Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 flex-1 sm:flex-none text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{format(selectedDate, 'MMMM yyyy')}</span>
                <span className="sm:hidden">{format(selectedDate, 'MMM yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && handleDateSelect(date)}
                className="rounded-md border-0"
                classNames={{
                  day_today: "bg-primary text-primary-foreground font-bold",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Today Button */}
          <Button 
            variant="outline" 
            onClick={goToToday}
            className="gap-2 text-sm"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Horizontal Date Navigation */}
      <Card className="card-modern">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek('prev')}
              className="rounded-full h-8 w-8 md:h-10 md:w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-1 w-max mx-auto">
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const taskCount = dayTaskCounts[dateStr];
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday_ = isToday(day);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center p-2 md:p-3 rounded-xl transition-all duration-200 min-w-[60px] md:min-w-[80px]",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : isToday_
                          ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <span className="text-xs font-medium mb-1">
                        {format(day, 'EEE')}
                      </span>
                      <span className={cn(
                        "text-base md:text-lg font-semibold",
                        isToday_ && !isSelected && "text-red-600 dark:text-red-400"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {/* Always render the task count span, but make it invisible when count is 0 */}
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 h-5", // Fixed height
                        taskCount > 0 
                          ? isSelected
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                          : "invisible" // Invisible but still takes up space
                      )}>
                        {taskCount > 0 ? taskCount : "0"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek('next')}
              className="rounded-full h-8 w-8 md:h-10 md:w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks for Selected Date */}
      <Card className="card-modern">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <ListTodo className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                <span className="hidden sm:inline">Tasks for {format(selectedDate, 'EEEE, MMMM d')}</span>
                <span className="sm:hidden">{format(selectedDate, 'MMM d, yyyy')}</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {selectedDateTasks.length === 0 
                  ? "No tasks scheduled for this date" 
                  : `${selectedDateTasks.length} task${selectedDateTasks.length === 1 ? '' : 's'} scheduled`}
              </p>
            </div>
          </div>
          
          <div className="w-full max-w-none">
            {selectedDateTasks.length > 0 ? (
              <TaskList tasks={selectedDateTasks} />
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <ListTodo className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No tasks scheduled
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
                  {isToday(selectedDate) 
                    ? "You're all caught up for today! Time to plan ahead or take a break."
                    : "No tasks are scheduled for this date. Select a different date or add new tasks."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}