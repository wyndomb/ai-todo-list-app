"use client";

import { useState } from 'react';
import { Task } from '@/lib/types';
import { TaskItem } from '@/components/tasks/task-item';
import { Button } from '@/components/ui/button';
import { useTodoStore } from '@/lib/store';
import { isPast, isToday, addDays, isFuture, format } from 'date-fns';
import { AddTaskDialog } from '@/components/tasks/add-task-dialog';
import { Plus } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const { filterBy } = useTodoStore();

  // Apply filters from the store
  const filteredTasks = tasks.filter(task => {
    // Category filter
    if (filterBy.category && task.category !== filterBy.category) {
      return false;
    }
    
    // Priority filter
    if (filterBy.priority && task.priority !== filterBy.priority) {
      return false;
    }
    
    // Search filter - handle both regular search and date search
    if (filterBy.search) {
      // Check for date filter format: due:YYYY-MM-DD
      if (filterBy.search.startsWith('due:')) {
        const dateStr = filterBy.search.replace('due:', '');
        return task.dueDate === dateStr;
      }
      // Regular search in title
      if (!task.title.toLowerCase().includes(filterBy.search.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Group tasks by status
  const today = new Date().toISOString().split('T')[0];
  
  const focusTasks = filteredTasks.filter(task => 
    !task.completed && 
    ((task.dueDate && isToday(new Date(task.dueDate))) || 
     task.priority === 'urgent')
  );

  const dueSoonTasks = filteredTasks.filter(task =>
    !task.completed &&
    task.dueDate &&
    isFuture(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate)) &&
    new Date(task.dueDate) <= addDays(new Date(), 7)
  );

  const backlogTasks = filteredTasks.filter(task =>
    !task.completed &&
    (!task.dueDate || new Date(task.dueDate) > addDays(new Date(), 7))
  );

  const completedTasks = filteredTasks.filter(task => task.completed);

  // Helper function to render a task group
  const renderTaskGroup = (tasks: Task[], title: string, emoji: string) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground pl-1">
          <span>{emoji}</span>
          <span>{title}</span>
          <span className="text-xs font-normal">({tasks.length})</span>
        </h3>
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="space-y-8">
        {renderTaskGroup(focusTasks, "Focus for Today", "⚡️")}
        {renderTaskGroup(dueSoonTasks, "Due Soon", "⏳")}
        {renderTaskGroup(backlogTasks, "Backlog", "🧠")}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t">
            {renderTaskGroup(completedTasks, "Completed", "✅")}
          </div>
        )}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tasks found matching the current filters</p>
            <Button 
              onClick={() => setShowAddTask(true)}
              className="gap-2 mt-4"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add New Task
            </Button>
          </div>
        )}
      </div>

      <AddTaskDialog open={showAddTask} onOpenChange={setShowAddTask} />
    </div>
  );
}