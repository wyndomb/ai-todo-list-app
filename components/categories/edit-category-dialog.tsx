"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Category } from '@/lib/types';
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
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name must be 50 characters or less"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined color palette
const colorPalette = [
  '#818cf8', '#22d3ee', '#22c55e', '#eab308', '#ec4899', '#f97316',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f59e0b', '#ef4444', '#6366f1',
];

// Common Lucide icons for categories
const iconOptions = [
  'briefcase', 'user', 'heart', 'dollar-sign', 'book-open',
  'home', 'car', 'shopping-cart', 'gamepad-2', 'music',
  'camera', 'plane', 'coffee', 'dumbbell', 'graduation-cap',
  'laptop', 'smartphone', 'calendar', 'clock', 'star',
  'folder', 'file-text', 'settings', 'tool', 'paint-brush'
];

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  const { categories, updateCategory } = useTodoStore();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      color: category.color,
      icon: category.icon,
    },
  });

  const handleSubmit = async (data: CategoryFormValues) => {
    // Check if category name already exists (excluding current category)
    if (categories.some(cat => 
      cat.id !== category.id && 
      cat.name.toLowerCase() === data.name.toLowerCase()
    )) {
      toast({
        title: "Category exists",
        description: "A category with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    await updateCategory(category.id, data);
    
    toast({
      title: "Category updated",
      description: `"${data.name}" category has been updated.`,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
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
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <select 
                      {...field}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                    >
                      {iconOptions.map(icon => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-6 gap-2">
                        {colorPalette.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                              field.value === color 
                                ? "border-gray-900 dark:border-gray-100 shadow-lg" 
                                : "border-gray-300 dark:border-gray-600"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Input 
                        {...field}
                        placeholder="#000000"
                        className="font-mono text-sm"
                      />
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}