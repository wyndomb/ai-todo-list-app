"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/lib/types';
import { TaskItem } from '@/components/tasks/task-item';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export function DraggableTaskItem({ task, isDragging }: DraggableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isCurrentlyDragging && "z-50 opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0",
            isCurrentlyDragging && "opacity-100"
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Task Item */}
        <div className="flex-1 min-w-0">
          <TaskItem task={task} />
        </div>
      </div>
    </div>
  );
}