"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTodoStore } from '@/lib/store';
import { Category } from '@/lib/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Palette,
  Hash,
  Save,
  X,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name must be 50 characters or less"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'view' | 'add';
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

// Common Lucide icons for categories
const iconOptions = [
  'briefcase', 'user', 'heart', 'dollar-sign', 'book-open',
  'home', 'car', 'shopping-cart', 'gamepad-2', 'music',
  'camera', 'plane', 'coffee', 'dumbbell', 'graduation-cap',
  'laptop', 'smartphone', 'calendar', 'clock', 'star',
  'folder', 'file-text', 'settings', 'tool', 'paint-brush'
];

export function CategoryManager({ open, onOpenChange, initialMode = 'view' }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory, tasks } = useTodoStore();
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: colorPalette[0],
      icon: 'folder',
    },
  });

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  // Set initial mode when dialog opens
  useEffect(() => {
    if (open && initialMode === 'add') {
      startAdding();
    }
  }, [open, initialMode]);

  const handleAddCategory = async (data: CategoryFormValues) => {
    // Check if category name already exists
    if (categories.some(cat => cat.name.toLowerCase() === data.name.toLowerCase())) {
      toast({
        title: "Category exists",
        description: "A category with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    await addCategory(data);
    
    toast({
      title: "Category added",
      description: `"${data.name}" category has been created.`,
    });
    
    form.reset();
    setIsAddingNew(false);
  };

  const handleEditCategory = async (data: CategoryFormValues) => {
    if (!editingCategory) return;

    // Check if category name already exists (excluding current category)
    if (categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === data.name.toLowerCase()
    )) {
      toast({
        title: "Category exists",
        description: "A category with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    await updateCategory(editingCategory.id, data);
    
    toast({
      title: "Category updated",
      description: `"${data.name}" category has been updated.`,
    });
    
    setEditingCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    const tasksUsingCategory = tasks.filter(task => task.category === deletingCategory.name);
    
    await deleteCategory(deletingCategory.id);
    
    toast({
      title: "Category deleted",
      description: tasksUsingCategory.length > 0 
        ? `"${deletingCategory.name}" deleted. ${tasksUsingCategory.length} tasks moved to "No Category".`
        : `"${deletingCategory.name}" category has been deleted.`,
    });
    
    setDeletingCategory(null);
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    editForm.reset();
  };

  const startAdding = () => {
    setIsAddingNew(true);
    form.reset({
      name: '',
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      icon: 'folder',
    });
  };

  const cancelAdding = () => {
    setIsAddingNew(false);
    form.reset();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Manage Categories
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {/* Add New Category Form */}
              {isAddingNew && (
                <div className="p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddCategory)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>

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

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" className="gap-2">
                          <Save className="h-4 w-4" />
                          Add Category
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelAdding} className="gap-2">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {/* Add New Button */}
              {!isAddingNew && (
                <Button 
                  onClick={startAdding}
                  variant="outline" 
                  className="w-full gap-2 border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-primary/50"
                >
                  <Plus className="h-4 w-4" />
                  Add New Category
                </Button>
              )}

              {/* Existing Categories */}
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200"
                  >
                    {editingCategory?.id === category.id ? (
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleEditCategory)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editForm.control}
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
                          </div>

                          <FormField
                            control={editForm.control}
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

                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="gap-2">
                              <Save className="h-4 w-4" />
                              Save Changes
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={cancelEditing} className="gap-2">
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {tasks.filter(task => task.category === category.name).length} tasks
                          </Badge>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              onClick={() => startEditing(category)}
                              className="gap-2"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingCategory(category)}
                              className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {categories.length === 0 && !isAddingNew && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No categories yet</p>
                  <p className="text-sm">Create your first category to organize your tasks</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              {tasks.filter(task => task.category === deletingCategory?.name).length > 0 && (
                <span className="block mt-2 font-medium text-orange-600 dark:text-orange-400">
                  {tasks.filter(task => task.category === deletingCategory?.name).length} task(s) 
                  using this category will be moved to "No Category".
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCategory}
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}