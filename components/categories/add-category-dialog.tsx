"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTodoStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name must be 50 characters or less"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Please select a color"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined color palette
const colorPalette = [
  '#818cf8', // Indigo
  '#22d3ee', // Cyan
  '#22c55e', // Green
  '#eab308', // Yellow
  '#ec4899', // Pink
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#06b6d4', // Sky
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#6366f1', // Indigo
];

export function AddCategoryDialog({ open, onOpenChange }: AddCategoryDialogProps) {
  const { categories, addCategory } = useTodoStore();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: colorPalette[0], // Default to first color
    },
  });

  const handleSubmit = async (data: CategoryFormValues) => {
    // Check if category name already exists
    if (categories.some(cat => cat.name.toLowerCase() === data.name.toLowerCase())) {
      toast({
        title: "Category exists",
        description: "A category with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    await addCategory({
      name: data.name,
      color: data.color,
      icon: 'folder', // Default folder icon
    });
    
    toast({
      title: "Category added",
      description: `"${data.name}" category has been created.`,
    });
    
    form.reset({
      name: '',
      color: colorPalette[0],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Category
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Travel, Hobbies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-6 gap-2">
                      {colorPalette.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                            field.value === color 
                              ? "border-gray-900 dark:border-gray-100 shadow-lg ring-2 ring-primary/20" 
                              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          )}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}