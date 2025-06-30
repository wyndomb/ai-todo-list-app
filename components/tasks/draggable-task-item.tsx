"use client";

import { useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/types";
import { TaskItem } from "@/components/tasks/task-item";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface DraggableTaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export function DraggableTaskItem({
  task,
  isDragging,
}: DraggableTaskItemProps) {
  const [isPressing, setIsPressing] = useState(false);
  const isMobile = useMobile();

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

  // Handle touch events for mobile feedback
  const handleTouchStart = useCallback(() => {
    if (isMobile) {
      setIsPressing(true);
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (isMobile) {
      setIsPressing(false);
    }
  }, [isMobile]);

  // Enhanced listeners for mobile touch feedback
  const enhancedListeners = {
    ...listeners,
    onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
      handleTouchStart();
      listeners?.onTouchStart?.(e.nativeEvent);
    },
    onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => {
      handleTouchEnd();
      listeners?.onTouchEnd?.(e.nativeEvent);
    },
    onTouchCancel: (e: React.TouchEvent<HTMLDivElement>) => {
      handleTouchEnd();
      listeners?.onTouchCancel?.(e.nativeEvent);
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative select-none",
        // Only apply touch-none when actually dragging
        isCurrentlyDragging && "touch-none",
        // On mobile, allow normal touch behavior when not dragging
        isMobile && !isCurrentlyDragging && "touch-auto",
        isCurrentlyDragging && "z-50 opacity-40 dragging"
      )}
      data-dnd-kit-dragging={isCurrentlyDragging}
      {...attributes}
      {...enhancedListeners}
    >
      {/* Task Item - now the entire item is draggable */}
      <div
        className={cn(
          "w-full transition-all duration-150",
          isCurrentlyDragging
            ? "cursor-grabbing scale-[0.98]"
            : "cursor-grab hover:cursor-grab active:cursor-grabbing",
          // Mobile-specific styling for better touch feedback
          isMobile &&
            isPressing &&
            "scale-[0.98] bg-gray-50 dark:bg-gray-800/50",
          !isMobile &&
            "md:active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-800/50"
        )}
      >
        <TaskItem task={task} isDragging={isCurrentlyDragging} />
      </div>
    </div>
  );
}
