"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Task } from '@/lib/types';
import { useTodoStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar,
  Check,
  X,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const subtaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});

type SubtaskFormValues = z.infer<typeof subtaskSchema>;

interface SubtaskManagerProps {
  parentTask: Task;
  subtasks: Task[];
}

export function SubtaskManager({ parentTask, subtasks }: SubtaskManagerProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const { addTask, updateTask, deleteTask, toggleTaskCompletion } = useTodoStore();
  const { toast } = useToast();

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const editForm = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskSchema),
  });

  const completedSubtasks = subtasks.filter(task => task.completed).length;
  const totalSubtasks = subtasks.length;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleAddSubtask = async (data: SubtaskFormValues) => {
    await addTask({
      title: data.title,
      description: data.description || undefined,
      completed: false,
      dueDate: data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : undefined,
      priority: parentTask.priority, // Inherit priority from parent
      category: parentTask.category, // Inherit category from parent
      parentId: parentTask.id,
    });

    toast({
      title: "Subtask added",
      description: `Added "${data.title}" to ${parentTask.title}`,
    });

    form.reset();
    setIsAddingSubtask(false);
  };

  const handleEditSubtask = async (subtaskId: string, data: SubtaskFormValues) => {
    await updateTask(subtaskId, {
      title: data.title,
      description: data.description || undefined,
      dueDate: data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : undefined,
    });

    toast({
      title: "Subtask updated",
      description: "Subtask has been updated successfully",
    });

    setEditingSubtaskId(null);
  };

  const handleDeleteSubtask = async (subtaskId: string, subtaskTitle: string) => {
    await deleteTask(subtaskId);
    toast({
      title: "Subtask deleted",
      description: `"${subtaskTitle}" has been removed`,
    });
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    await toggleTaskCompletion(subtaskId);
  };

  const startEditingSubtask = (subtask: Task) => {
    setEditingSubtaskId(subtask.id);
    editForm.reset({
      title: subtask.title,
      description: subtask.description || '',
      dueDate: subtask.dueDate ? new Date(subtask.dueDate) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Subtasks Header */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <h3 className="text-sm font-medium">
                Subtasks ({completedSubtasks}/{totalSubtasks})
              </h3>
              {totalSubtasks > 0 && (
                <Badge variant="outline" className="ml-2">
                  {completionPercentage}%
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingSubtask(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Subtask
          </Button>
        </div>

        {/* Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        )}

        <CollapsibleContent className="space-y-3 mt-4">
          {/* Add Subtask Form */}
          {isAddingSubtask && (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSubtask)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Subtask Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="What needs to be done?" 
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add details..."
                            rows={2}
                            {...field}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Due Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal h-9",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm">
                      <Check className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsAddingSubtask(false);
                        form.reset();
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Subtasks List */}
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
                  subtask.completed 
                    ? "bg-gray-50/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50" 
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                )}
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => handleToggleSubtask(subtask.id)}
                  className="mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  {editingSubtaskId === subtask.id ? (
                    <Form {...editForm}>
                      <form 
                        onSubmit={editForm.handleSubmit((data) => handleEditSubtask(subtask.id, data))}
                        className="space-y-2"
                      >
                        <FormField
                          control={editForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  {...field}
                                  rows={2}
                                  className="resize-none"
                                  placeholder="Description..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal h-8",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      <Calendar className="mr-2 h-3 w-3" />
                                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2">
                          <Button type="submit" size="sm" variant="outline">
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingSubtaskId(null)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 
                            className={cn(
                              "text-sm font-medium leading-tight",
                              subtask.completed && "line-through text-gray-500 dark:text-gray-400"
                            )}
                          >
                            {subtask.title}
                          </h4>
                          
                          {subtask.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {subtask.description}
                            </p>
                          )}

                          {subtask.dueDate && (
                            <Badge 
                              variant="outline" 
                              className="mt-2 text-xs"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(subtask.dueDate), 'MMM d')}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingSubtask(subtask)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubtask(subtask.id, subtask.title)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {subtasks.length === 0 && !isAddingSubtask && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No subtasks yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubtask(true)}
                  className="mt-2 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add your first subtask
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}