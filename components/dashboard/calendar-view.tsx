"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTodoStore } from '@/lib/store';
import { TaskItem } from '@/components/tasks/task-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from '@/components/ui/sheet';
import { CalendarIcon, ListTodo, X } from 'lucide-react';

interface CalendarViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarView({ open, onOpenChange }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { tasks, setFilter } = useTodoStore();

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
      const dateStr = format(date, 'yyyy-MM-dd');
      setFilter({ search: `due:${dateStr}` });
      // Close the sheet after selecting a date
      onOpenChange(false);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setFilter({ search: '' });
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col h-full p-0">
      <SheetHeader className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold">Calendar View</SheetTitle>
              <SheetDescription className="text-sm">
                Browse and filter tasks by date
              </SheetDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {selectedDateTasks.length} tasks
          </Badge>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
          {/* Calendar Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Select Date
              </h3>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
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
              className="rounded-xl border w-full"
              classNames={{
                day_today: "bg-primary text-primary-foreground font-bold",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              }}
            />
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedDateTasks.length === 0 
                    ? 'No tasks scheduled for this date' 
                    : `${selectedDateTasks.length} task${selectedDateTasks.length === 1 ? '' : 's'} scheduled`}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ListTodo className="h-4 w-4 text-primary" />
              </div>
            </div>

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
          </div>
        </div>
      </div>

      <SheetFooter className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            Click a date to filter tasks and close this panel
          </div>
          <Button
            variant="outline"
            onClick={clearDateFilter}
            className="text-xs"
          >
            Clear Date Filter
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  );
}