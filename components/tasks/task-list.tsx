"use client";

import { useState } from 'react';
import { Task } from '@/lib/types';
import { TaskItem } from '@/components/tasks/task-item';
import { Button } from '@/components/ui/button';
import { useTodoStore } from '@/lib/store';
import { isPast, isToday, addDays, isFuture } from 'date-fns';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AddTaskDialog } from '@/components/tasks/add-task-dialog';
import { Plus, Filter } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories } = useTodoStore();

  // Filter tasks by category
  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

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
      <div className="flex items-center justify-between mb-6">
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
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

        <Button 
          onClick={() => setShowAddTask(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

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
            <p>No tasks found in this category</p>
          </div>
        )}
      </div>

      <AddTaskDialog open={showAddTask} onOpenChange={setShowAddTask} />
    </div>
  );
}