"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { Task } from "@/lib/types";
import { useTodoStore } from "@/lib/store";
import { DraggableTaskItem } from "@/components/tasks/draggable-task-item";
import { TaskItem } from "@/components/tasks/task-item";
import { useMobile } from "@/hooks/use-mobile";

interface SortableTaskListProps {
  tasks: Task[];
  title?: string;
  emoji?: string;
}

// Custom modifier to improve cursor alignment
const snapCenterToCursor = ({ transform, ...args }: any) => {
  return {
    ...transform,
    x: transform.x,
    y: transform.y,
    scaleX: 1,
    scaleY: 1,
  };
};

export function SortableTaskList({
  tasks,
  title,
  emoji,
}: SortableTaskListProps) {
  const { reorderTasks } = useTodoStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const isMobile = useMobile();

  // Configure sensors based on device type
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile
        ? {
            // On mobile: require 50ms hold time before drag starts
            delay: 50,
            tolerance: 5, // Allow 5px movement during the delay
          }
        : {
            // On desktop: immediate drag with small distance threshold
            distance: 3,
          },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const taskIds = tasks.map((task) => task.id);
      reorderTasks(taskIds, oldIndex, newIndex);
    }
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {title && (
        <div className="flex items-center gap-2 px-1 pt-4 pb-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[
          restrictToVerticalAxis,
          restrictToWindowEdges,
          snapCenterToCursor,
        ]}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0">
            {tasks.map((task) => (
              <DraggableTaskItem key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay
          adjustScale={false}
          style={{
            transformOrigin: "0 0",
          }}
        >
          {activeTask ? (
            <div
              className="shadow-2xl bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 opacity-95"
              style={{
                cursor: "grabbing",
                transformOrigin: "0 0",
              }}
            >
              <TaskItem task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
