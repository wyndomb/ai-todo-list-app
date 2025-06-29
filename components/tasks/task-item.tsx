"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import { format, isToday, isPast } from "date-fns";
import { useTodoStore } from "@/lib/store";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import {
  CalendarDays,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles,
  Eye,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";

interface TaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskItem({ task, isDragging = false }: TaskItemProps) {
  const { toggleTaskCompletion, deleteTask, tasks } = useTodoStore();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEmojiBurst, setShowEmojiBurst] = useState(false);

  const isPastDue = task.dueDate
    ? isPast(new Date(task.dueDate)) && !task.completed
    : false;
  const isToday_ = task.dueDate ? isToday(new Date(task.dueDate)) : false;

  // Get subtasks count for parent tasks
  const subtasks = tasks.filter((t) => t.parentId === task.id);
  const completedSubtasks = subtasks.filter((t) => t.completed).length;

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
      low: "bg-green-400",
      medium: "bg-yellow-400",
      high: "bg-orange-400",
      urgent: "bg-red-400",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-400";
  };

  const getCategoryColor = (category?: string) => {
    const colors = {
      Work: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      Personal:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      Health:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      Finance:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      Education:
        "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    };
    return (
      colors[category as keyof typeof colors] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  const getPriorityBorderColor = (priority: string, completed: boolean) => {
    const colors = {
      low: completed ? "border-green-400" : "border-green-200",
      medium: completed ? "border-yellow-400" : "border-yellow-200",
      high: completed ? "border-orange-400" : "border-orange-200",
      urgent: completed ? "border-red-400" : "border-red-200",
    };
    return colors[priority as keyof typeof colors] || "border-gray-200";
  };

  return (
    <>
      <div
        className={cn(
          "relative flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200",
          !isDragging &&
            "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50",
          task.completed && "opacity-50",
          "w-full max-w-none bg-white dark:bg-gray-900",
          isDragging && "pointer-events-none"
        )}
        onClick={!isDragging ? () => setShowDetailDialog(true) : undefined}
      >
        {/* Emoji burst animation */}
        {showEmojiBurst && (
          <div className="absolute top-2 left-2 text-xl animate-emoji-burst pointer-events-none">
            🎉
          </div>
        )}

        <div className="flex-shrink-0">
          <CustomCheckbox
            checked={task.completed}
            onChange={handleToggleCompletion}
            onClick={(e) => e.stopPropagation()}
            size="lg"
            className={cn(
              getPriorityBorderColor(task.priority, task.completed)
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Line 1: Title and AI sparkle */}
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-medium leading-tight text-gray-800 dark:text-gray-200 truncate",
                task.completed &&
                  "line-through text-gray-500 dark:text-gray-400"
              )}
            >
              {task.title}
            </h3>
            {task.aiGenerated && (
              <Sparkles className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
            )}
          </div>

          {/* Line 2: Date and Priority */}
          {(task.dueDate || task.category) && (
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-3">
                {task.dueDate && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays
                      className={cn(
                        "h-3.5 w-3.5",
                        isPastDue
                          ? "text-red-500"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isPastDue
                          ? "text-red-500"
                          : "text-gray-600 dark:text-gray-300"
                      )}
                    >
                      {format(new Date(task.dueDate), "MMM d")}
                    </span>
                  </div>
                )}
              </div>
              {task.category && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    getCategoryColor(task.category)
                  )}
                >
                  {task.category}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 -mr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/60"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-xl border-gray-200/50 dark:border-gray-700/50 shadow-lg"
            >
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
