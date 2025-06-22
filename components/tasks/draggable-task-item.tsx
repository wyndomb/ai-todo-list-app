"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/types";
import { TaskItem } from "@/components/tasks/task-item";
import { cn } from "@/lib/utils";

interface DraggableTaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export function DraggableTaskItem({
  task,
  isDragging,
}: DraggableTaskItemProps) {
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
    transformOrigin: "0 0",
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative touch-none",
        isCurrentlyDragging && "z-50 opacity-40 dragging"
      )}
      data-dnd-kit-dragging={isCurrentlyDragging}
      {...attributes}
      {...listeners}
    >
      {/* Task Item - now the entire item is draggable */}
      <div
        className={cn(
          "w-full transition-all duration-150",
          isCurrentlyDragging
            ? "cursor-grabbing scale-[0.98]"
            : "cursor-grab hover:cursor-grab active:cursor-grabbing"
        )}
      >
        <TaskItem task={task} isDragging={isCurrentlyDragging} />
      </div>
    </div>
  );
}
