"use client";

import { useState } from 'react';
import { Task } from '@/lib/types';
import { format, isToday, isPast } from 'date-fns';
import { useTodoStore } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
import { 
  CalendarDays,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles,
  Eye,
  List
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { toggleTaskCompletion, deleteTask, tasks } = useTodoStore();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEmojiBurst, setShowEmojiBurst] = useState(false);
  
  const isPastDue = task.dueDate ? isPast(new Date(task.dueDate)) && !task.completed : false;
  const isToday_ = task.dueDate ? isToday(new Date(task.dueDate)) : false;
  
  // Get subtasks count for parent tasks
  const subtasks = tasks.filter(t => t.parentId === task.id);
  const completedSubtasks = subtasks.filter(t => t.completed).length;
  
  const handleToggleCompletion = () => {
    toggleTaskCompletion(task.id);
    
    if (!task.completed) {
      setShowEmojiBurst(true);
      setTimeout(() => setShowEmojiBurst(false), 800);
      
      toast({
        title: "🎉 Task completed!",
        description: `You've completed: ${task.title}`,
      });
    }
  };
  
  const handleDelete = () => {
    deleteTask(task.id);
    toast({
      title: "Task deleted",
      description: "The task has been removed from your list",
    });
  };

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
    const colors = {
      Work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      Personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      Health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      Finance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      Education: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <>
      <div 
        className={cn(
          "relative flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md",
          task.completed 
            ? "bg-gray-50/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50" 
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          "w-full max-w-none"
        )}
        onClick={() => setShowDetailDialog(true)}
      >
        {/* Emoji burst animation */}
        {showEmojiBurst && (
          <div className="absolute top-2 left-2 text-2xl animate-emoji-burst pointer-events-none">
            🎉
          </div>
        )}
        
        <Checkbox 
          checked={task.completed}
          onCheckedChange={handleToggleCompletion}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "transition-all duration-200 flex-shrink-0 mt-0.5",
            task.completed && "animate-task-complete"
          )}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h3 
                  className={cn(
                    "text-sm md:text-base font-medium leading-tight transition-all duration-200",
                    task.completed && "line-through text-gray-500 dark:text-gray-400"
                  )}
                >
                  {task.title}
                </h3>
                {task.aiGenerated && (
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                )}
                {subtasks.length > 0 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    <List className="h-3 w-3 mr-1" />
                    {completedSubtasks}/{subtasks.length}
                  </Badge>
                )}
              </div>
              
              {task.description && (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Mobile: Show badges below description */}
              <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
                {task.category && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-2 py-1 rounded-lg font-medium",
                      getCategoryColor(task.category)
                    )}
                  >
                    {task.category}
                  </Badge>
                )}
                
                {task.dueDate && (
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium",
                      isPastDue 
                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" 
                        : isToday_ 
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" 
                        : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                    )}
                  >
                    {isPastDue ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CalendarDays className="h-3 w-3" />
                    )}
                    {format(new Date(task.dueDate), 'MMM d')}
                  </Badge>
                )}
                
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    getPriorityColor(task.priority)
                  )}
                />
              </div>
            </div>
            
            {/* Desktop: Show badges and menu on the right */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {task.category && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs px-2 py-1 rounded-lg font-medium",
                    getCategoryColor(task.category)
                  )}
                >
                  {task.category}
                </Badge>
              )}
              
              {task.dueDate && (
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium",
                    isPastDue 
                      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" 
                      : isToday_ 
                      ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" 
                      : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                  )}
                >
                  {isPastDue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <CalendarDays className="h-3 w-3" />
                  )}
                  {format(new Date(task.dueDate), 'MMM d')}
                </Badge>
              )}
              
              <div 
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  getPriorityColor(task.priority)
                )}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailDialog(true);
                    }} 
                    className="rounded-lg"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditDialog(true);
                    }} 
                    className="rounded-lg"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 rounded-lg"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile: Show menu button at bottom right */}
        <div className="sm:hidden absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailDialog(true);
                }} 
                className="rounded-lg"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }} 
                className="rounded-lg"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 rounded-lg"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {showEditDialog && (
        <EditTaskDialog 
          task={task} 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog}
        />
      )}

      {showDetailDialog && (
        <TaskDetailDialog
          task={task}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
    </>
  );
}