"use client";

import { useState, useMemo } from 'react';
import { Task } from '@/lib/types';
import { TaskItem } from '@/components/tasks/task-item';
import { Button } from '@/components/ui/button';
import { useTodoStore } from '@/lib/store';
import { isPast, isToday, addDays, isFuture, format } from 'date-fns';
import { AddTaskDialog } from '@/components/tasks/add-task-dialog';
import { Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
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
    
    // Search filter (including date filter)
    if (filterBy.search) {
      // Check for date filter format: due:YYYY-MM-DD
      if (filterBy.search.startsWith('due:')) {
        const dateStr = filterBy.search.replace('due:', '');
        return task.dueDate === dateStr;
      }
      // Regular search in task title
      if (!task.title.toLowerCase().includes(filterBy.search.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Organize tasks into hierarchy (parent tasks with their subtasks)
  const organizedTasks = useMemo(() => {
    const parentTasks = filteredTasks.filter(task => !task.parentId);
    const subtasksByParent = filteredTasks
      .filter(task => task.parentId)
      .reduce((acc, task) => {
        if (!acc[task.parentId!]) acc[task.parentId!] = [];
        acc[task.parentId!].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

    return { parentTasks, subtasksByParent };
  }, [filteredTasks]);

  // Group parent tasks by status
  const today = new Date().toISOString().split('T')[0];
  
  const focusTasks = organizedTasks.parentTasks.filter(task => 
    !task.completed && 
    ((task.dueDate && isToday(new Date(task.dueDate))) || 
     task.priority === 'urgent')
  );

  const dueSoonTasks = organizedTasks.parentTasks.filter(task =>
    !task.completed &&
    task.dueDate &&
    isFuture(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate)) &&
    new Date(task.dueDate) <= addDays(new Date(), 7)
  );

  const backlogTasks = organizedTasks.parentTasks.filter(task =>
    !task.completed &&
    (!task.dueDate || new Date(task.dueDate) > addDays(new Date(), 7))
  );

  const completedTasks = organizedTasks.parentTasks.filter(task => task.completed);

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  // Helper function to render a task with its subtasks
  const renderTaskWithSubtasks = (task: Task) => {
    const subtasks = organizedTasks.subtasksByParent[task.id] || [];
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedParents.has(task.id);

    return (
      <div key={task.id} className="space-y-2">
        <div className="flex items-start gap-2">
          {hasSubtasks && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg mt-1 flex-shrink-0"
              onClick={() => toggleParentExpansion(task.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className={cn("flex-1", !hasSubtasks && "ml-10")}>
            <TaskItem task={task} />
          </div>
        </div>
        
        {/* Render subtasks if expanded */}
        {hasSubtasks && isExpanded && (
          <div className="ml-12 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {subtasks.map(subtask => (
              <div key={subtask.id} className="relative">
                <div className="absolute -left-4 top-4 w-2 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <TaskItem task={subtask} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to render a task group
  const renderTaskGroup = (tasks: Task[], title: string, emoji: string) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">{emoji}</span>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            ({tasks.length})
          </span>
        </div>
        <div className="space-y-2">
          {tasks.map(task => renderTaskWithSubtasks(task))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-none">
      <div className="space-y-6">
        {renderTaskGroup(focusTasks, "Focus for Today", "⚡️")}
        {renderTaskGroup(dueSoonTasks, "Due Soon", "⏳")}
        {renderTaskGroup(backlogTasks, "Backlog", "🧠")}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {renderTaskGroup(completedTasks, "Completed", "✅")}
          </div>
        )}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="mb-4">No tasks found matching the current filters</p>
            <Button 
              onClick={() => setShowAddTask(true)}
              className="gap-2"
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