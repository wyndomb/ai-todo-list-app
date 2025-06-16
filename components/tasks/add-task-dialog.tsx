"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useTodoStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional(),
  parentId: z.string().optional(),
  isRecurringTemplate: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrenceEndDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { addTask, categories, tasks } = useTodoStore();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      isRecurringTemplate: false,
    },
  });
  
  const isRecurringTemplate = form.watch('isRecurringTemplate');
  
  // Get potential parent tasks (exclude completed and subtasks)
  const potentialParentTasks = tasks.filter(task => 
    !task.completed && !task.parentId && !task.isRecurringTemplate
  );
  
  const onSubmit = (data: FormValues) => {
    // If no due date is selected, default to today
    const dueDate = data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    
    addTask({
      title: data.title,
      description: data.description || undefined,
      completed: false,
      dueDate: dueDate,
      priority: data.priority,
      category: data.category,
      parentId: data.parentId,
      isRecurringTemplate: data.isRecurringTemplate,
      recurrencePattern: data.isRecurringTemplate ? data.recurrencePattern : undefined,
      recurrenceEndDate: data.isRecurringTemplate && data.recurrenceEndDate 
        ? format(data.recurrenceEndDate, 'yyyy-MM-dd') 
        : undefined,
    });
    
    toast({
      title: data.isRecurringTemplate ? "Recurring task created" : "Task added",
      description: data.isRecurringTemplate 
        ? "Your recurring task and its instances have been created."
        : "Your new task has been created.",
    });
    
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details about this task (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Task Selection */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Task (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent task to create a subtask" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent (standalone task)</SelectItem>
                      {potentialParentTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px]">{task.title}</span>
                            {task.category && (
                              <span className="text-xs text-gray-500">({task.category})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Subtasks inherit the category from their parent task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Task Checkbox */}
            <FormField
              control={form.control}
              name="isRecurringTemplate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Make this a recurring task
                    </FormLabel>
                    <FormDescription className="text-xs">
                      This will create multiple instances of the task based on the recurrence pattern
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Recurrence Pattern - Only show if recurring is enabled */}
            {isRecurringTemplate && (
              <FormField
                control={form.control}
                name="recurrencePattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurrence Pattern</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "daily"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select how often this task repeats" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      {isRecurringTemplate ? "Start Date" : "Due Date"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Today (default)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
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
                    <FormDescription className="text-xs">
                      {isRecurringTemplate 
                        ? "The first occurrence date for the recurring task"
                        : "Leave empty to set due date as today"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurrence End Date - Only show if recurring is enabled */}
              {isRecurringTemplate ? (
                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>12 months (default)</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
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
                      <FormDescription className="text-xs">
                        When to stop creating recurring instances
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              Low
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                              High
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-400"></div>
                              Urgent
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Show priority for recurring tasks in full width */}
            {isRecurringTemplate && (
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Category - Only show if not a subtask */}
            {!form.watch('parentId') && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              ></div>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isRecurringTemplate ? "Create Recurring Task" : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}