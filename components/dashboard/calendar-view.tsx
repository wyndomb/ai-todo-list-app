"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTodoStore } from '@/lib/store';
import { TaskItem } from '@/components/tasks/task-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, ListTodo } from 'lucide-react';

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { tasks } = useTodoStore();

  // Get tasks for the selected date
  const selectedDateTasks = tasks.filter(task => {
    if (!selectedDate || !task.dueDate) return false;
    return task.dueDate === format(selectedDate, 'yyyy-MM-dd');
  });

  // Get dates with tasks for highlighting in calendar
  const datesWithTasks = tasks
    .filter(task => task.dueDate)
    .map(task => new Date(task.dueDate!));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calendar View</h1>
          <p className="text-muted-foreground">Manage and view your tasks by date</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
              onSelect={setSelectedDate}
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
              <ScrollArea className="h-[600px] pr-4">
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
  );
}