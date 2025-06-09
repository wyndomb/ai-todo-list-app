"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTodoStore } from '@/lib/store';
import { TaskItem } from '@/components/tasks/task-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, ListTodo, X, Filter } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from '@/components/ui/sheet';

interface CalendarViewProps {
  open: boolean;
  onClose: () => void;
}

export function CalendarView({ open, onClose }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { tasks, setFilter, filterBy } = useTodoStore();

  // Get tasks for the selected date
  const selectedDateTasks = tasks.filter(task => {
    if (!selectedDate || !task.dueDate) return false;
    return task.dueDate === format(selectedDate, 'yyyy-MM-dd');
  });

  // Get dates with tasks for highlighting in calendar
  const datesWithTasks = tasks
    .filter(task => task.dueDate)
    .map(task => new Date(task.dueDate!));

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Apply date filter to the main task list
      const dateString = format(date, 'yyyy-MM-dd');
      setFilter({ search: `due:${dateString}` });
    }
  };

  const handleClearDateFilter = () => {
    setFilter({ search: '' });
    setSelectedDate(undefined);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col h-full p-0 bg-white dark:bg-gray-900 border-l border-gray-200/50 dark:border-gray-700/50">
        <SheetHeader className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-md">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">Calendar View</SheetTitle>
                <SheetDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Manage and view your tasks by date
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <Card className="lg:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calendar</CardTitle>
                <Badge variant="outline">
                  {selectedDateTasks.length} tasks
                </Badge>
              </CardHeader>
              <CardContent>
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
                  className="rounded-md border w-full"
                  classNames={{
                    day_today: "bg-primary text-primary-foreground font-bold",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  }}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedDateTasks.length === 0 
                      ? 'No tasks scheduled for this date' 
                      : `${selectedDateTasks.length} task${selectedDateTasks.length === 1 ? '' : 's'} scheduled`}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ListTodo className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {selectedDateTasks.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {selectedDateTasks.map(task => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ListTodo className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No tasks scheduled for this date</p>
                    <p className="text-xs text-muted-foreground">
                      Select a different date or add new tasks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {filterBy.search && filterBy.search.startsWith('due:') && (
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <span>Date filter active</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {filterBy.search && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearDateFilter}
                  className="rounded-xl"
                >
                  Clear Filter
                </Button>
              )}
              <Button 
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                Done
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}