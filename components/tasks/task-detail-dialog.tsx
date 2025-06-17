"use client";

import { useState } from 'react';
import { Task } from '@/lib/types';
import { useTodoStore } from '@/lib/store';
import { format, isToday, isPast } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SubtaskManager } from '@/components/tasks/subtask-manager';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';
import { 
  CalendarDays,
  Edit,
  AlertTriangle,
  Sparkles,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { tasks, toggleTaskCompletion, categories } = useTodoStore();
  
  // Get subtasks for this task
  const subtasks = tasks.filter(t => t.parentId === task.id);
  
  const isPastDue = task.dueDate ? isPast(new Date(task.dueDate)) && !task.completed : false;
  const isToday_ = task.dueDate ? isToday(new Date(task.dueDate)) : false;
  
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-400',
      medium: 'bg-yellow-400',
      high: 'bg-orange-400',
      urgent: 'bg-red-400',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-400';
  };

  const getCategoryColor = (category?: string) => {
    const categoryObj = categories.find(c => c.name === category);
    return categoryObj?.color || '#6b7280';
  };

  const handleToggleCompletion = () => {
    toggleTaskCompletion(task.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold leading-tight pr-4">
                  {task.title}
                </DialogTitle>
                
                {/* Task metadata */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {/* Completion checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={handleToggleCompletion}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.completed ? 'Completed' : 'Mark as complete'}
                    </span>
                  </div>

                  {/* Priority indicator */}
                  <div className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-full",
                        getPriorityColor(task.priority)
                      )}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {task.priority} priority
                    </span>
                  </div>

                  {/* Category */}
                  {task.category && (
                    <Badge 
                      variant="secondary" 
                      className="gap-1"
                      style={{ 
                        backgroundColor: `${getCategoryColor(task.category)}20`,
                        color: getCategoryColor(task.category),
                        borderColor: `${getCategoryColor(task.category)}40`
                      }}
                    >
                      <Hash className="h-3 w-3" />
                      {task.category}
                    </Badge>
                  )}

                  {/* Due date */}
                  {task.dueDate && (
                    <Badge 
                      variant="outline"
                      className={cn(
                        "gap-1",
                        isPastDue 
                          ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" 
                          : isToday_ 
                          ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" 
                          : ""
                      )}
                    >
                      {isPastDue ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CalendarDays className="h-3 w-3" />
                      )}
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </Badge>
                  )}

                  {/* AI generated indicator */}
                  {task.aiGenerated && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      AI Generated
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="gap-2 flex-shrink-0"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* AI Suggestions */}
              {task.aiSuggestions && task.aiSuggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Suggestions
                  </h3>
                  <ul className="space-y-1">
                    {task.aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subtasks Section - Only show for parent tasks */}
              {!task.parentId && (
                <div>
                  <SubtaskManager 
                    parentTask={task} 
                    subtasks={subtasks}
                  />
                </div>
              )}

              {/* Parent task info - Only show for subtasks */}
              {task.parentId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Parent Task
                  </h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium">
                      {tasks.find(t => t.id === task.parentId)?.title || 'Unknown Task'}
                    </p>
                  </div>
                </div>
              )}

              {/* Task metadata details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Created
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                
                {subtasks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Subtasks
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {subtasks.filter(s => s.completed).length} of {subtasks.length} completed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <EditTaskDialog 
          task={task} 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}