"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTodoStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

function AddTaskForm({
  onDone,
  defaultDate,
}: {
  onDone: () => void;
  defaultDate?: Date;
}) {
  const { addTask, categories } = useTodoStore();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      dueDate: defaultDate || new Date(),
    },
  });

  const onSubmit = (data: FormValues) => {
    const dueDate = data.dueDate
      ? format(data.dueDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    addTask({
      title: data.title,
      description: data.description || undefined,
      completed: false,
      dueDate: dueDate,
      priority: data.priority,
      category: data.category,
    });

    toast({
      title: "Task added",
      description: "Your new task has been created.",
    });
    onDone();
  };

  // Force submit function that can be called from anywhere
  const forceSubmit = () => {
    form.handleSubmit(onSubmit)();
  };

  // Handle keyboard events to ensure Enter submits the form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Don't submit if we're in a textarea and want to add a new line
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't submit if a popover or select is open
      const openPopovers = document.querySelectorAll('[data-state="open"]');
      if (openPopovers.length > 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      forceSubmit();
    }
  };

  // Specific handler for title input with more aggressive approach
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      // Check if title is not empty (basic validation)
      const titleValue = e.currentTarget.value.trim();
      if (titleValue) {
        forceSubmit();
      } else {
        // Focus stays on title if empty
        e.currentTarget.focus();
      }
    }
  };

  // Focus title input when dialog opens
  useEffect(() => {
    if (titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 py-4"
        onKeyDown={(e) => {
          // Prevent default form submission on Enter
          if (e.key === "Enter" && e.target !== e.currentTarget) {
            e.preventDefault();
          }
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  ref={titleInputRef}
                  placeholder="What needs to be done?"
                  onKeyDown={handleTitleKeyDown}
                  autoComplete="off"
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add details about this task (optional)"
                  className="resize-none"
                  rows={3}
                  {...field}
                  onKeyDown={(e) => {
                    // Allow Enter for new lines in textarea, but Ctrl+Enter or Cmd+Enter submits
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      forceSubmit();
                    }
                  }}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Press Ctrl+Enter (or Cmd+Enter) to submit while in description
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        onKeyDown={handleKeyDown}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
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
                  Tasks are due at the end of the day.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger onKeyDown={handleKeyDown}>
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
                <FormDescription className="text-xs">
                  Higher priority tasks appear first
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? undefined : value)
                }
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger onKeyDown={handleKeyDown}>
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

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">Add Task</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function AddTaskDialog({
  open,
  onOpenChange,
  defaultDate,
}: AddTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        {open && (
          <AddTaskForm
            key={defaultDate ? defaultDate.toISOString() : "new"}
            onDone={() => onOpenChange(false)}
            defaultDate={defaultDate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
