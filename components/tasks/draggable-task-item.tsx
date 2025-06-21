"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/lib/types';
import { TaskItem } from '@/components/tasks/task-item';
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
      {...attributes}
      {...listeners}
    >
      {/* Task Item - now the entire item is draggable */}
      <div className="w-full cursor-grab active:cursor-grabbing">
        <TaskItem task={task} />
      </div>
    </div>
  );
}