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
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CalendarIcon, ListTodo, X } from 'lucide-react';

interface CalendarViewProps {
  onClose: () => void;
}

export function CalendarView({ onClose }: CalendarViewProps) {
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
      // Set filter to show tasks for the selected date
      setFilter({ search: `due:${format(date, 'yyyy-MM-dd')}` });
      // Close the sheet after date selection
      onClose();
    }
  };

  const handleClearDateFilter = () => {
    setSelectedDate(undefined);
    setFilter({ search: '' });
    onClose();
  };

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-md">
          <CalendarIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <SheetTitle className="text-lg font-semibold">Calendar</SheetTitle>
          <SheetDescription className="text-xs text-gray-600 dark:text-gray-400">
            Select a date to filter your tasks
          </SheetDescription>
        </div>
      </SheetHeader>

      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Calendar */}
        <Card className="flex-shrink-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Select Date</CardTitle>
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

        {/* Clear Filter Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleClearDateFilter}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Date Filter
          </Button>
        </div>

        {/* Tasks for Selected Date */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
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
          <CardContent className="flex-1 min-h-0">
            {selectedDateTasks.length > 0 ? (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {selectedDateTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
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
    </>
  );
}