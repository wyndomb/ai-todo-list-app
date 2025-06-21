"use client";

import { useState } from 'react';
import { Category } from '@/lib/types';
import { useTodoStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal,
  Edit3, 
  Trash2,
} from 'lucide-react';
import { EditCategoryDialog } from '@/components/categories/edit-category-dialog';
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

interface CategoryDropdownProps {
  category: Category;
}

export function CategoryDropdown({ category }: CategoryDropdownProps) {
  const { deleteCategory, tasks } = useTodoStore();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const tasksUsingCategory = tasks.filter(task => task.category === category.name);

  const handleDelete = async () => {
    await deleteCategory(category.id);
    
    toast({
      title: "Category deleted",
      description: tasksUsingCategory.length > 0 
        ? `"${category.name}" deleted. ${tasksUsingCategory.length} tasks moved to "No Category".`
        : `"${category.name}" category has been deleted.`,
    });
    
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setShowEditDialog(true);
            }}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCategoryDialog 
        category={category}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{category.name}"? 
              {tasksUsingCategory.length > 0 && (
                <span className="block mt-2 font-medium text-orange-600 dark:text-orange-400">
                  {tasksUsingCategory.length} task(s) using this category will be moved to "No Category".
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}