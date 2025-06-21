"use client";

import { useState } from 'react';
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { Task } from '@/lib/types';
import { useTodoStore } from '@/lib/store';
import { DraggableTaskItem } from '@/components/tasks/draggable-task-item';
import { TaskItem } from '@/components/tasks/task-item';

interface SortableTaskListProps {
  tasks: Task[];
  title?: string;
  emoji?: string;
}

export function SortableTaskList({ tasks, title, emoji }: SortableTaskListProps) {
  const { reorderTasks } = useTodoStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tasks.findIndex(task => task.id === active.id);
    const newIndex = tasks.findIndex(task => task.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const taskIds = tasks.map(task => task.id);
      reorderTasks(taskIds, oldIndex, newIndex);
    }
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-2 px-1">
          {emoji && <span className="text-lg">{emoji}</span>}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            ({tasks.length})
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <DraggableTaskItem
                key={task.id}
                task={task}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <div className="transform rotate-3 shadow-2xl">
              <TaskItem task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}