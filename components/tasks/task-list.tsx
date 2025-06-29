"use client";

import { useState, useMemo } from "react";
import { Task } from "@/lib/types";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";
import { Button } from "@/components/ui/button";
import { useTodoStore } from "@/lib/store";
import { isPast, isToday, addDays, isFuture } from "date-fns";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { Plus } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  selectedDate?: Date;
}

export function TaskList({ tasks, selectedDate }: TaskListProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const { filterBy } = useTodoStore();

  // Apply filters from the store
  const filteredTasks = tasks.filter((task) => {
    // Category filter
    if (filterBy.category && task.category !== filterBy.category) {
      return false;
    }

    // Priority filter
    if (filterBy.priority && task.priority !== filterBy.priority) {
      return false;
    }

    // Search filter (including date filter)
    if (filterBy.search) {
      // Check for date filter format: due:YYYY-MM-DD
      if (filterBy.search.startsWith("due:")) {
        const dateStr = filterBy.search.replace("due:", "");
        return task.dueDate === dateStr;
      }
      // Regular search in task title
      if (!task.title.toLowerCase().includes(filterBy.search.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Only show parent tasks (no subtasks in main list)
  const parentTasks = filteredTasks.filter((task) => !task.parentId);

  // Group parent tasks by status
  const today = new Date().toISOString().split("T")[0];

  // Overdue tasks - tasks that are not completed and have a due date in the past
  const overdueTasks = parentTasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      isPast(new Date(task.dueDate)) &&
      !isToday(new Date(task.dueDate))
  );

  // Focus tasks - today's tasks and urgent tasks, but exclude overdue tasks
  const focusTasks = parentTasks.filter(
    (task) =>
      !task.completed &&
      !overdueTasks.includes(task) && // Exclude tasks that are already in overdue
      ((task.dueDate && isToday(new Date(task.dueDate))) ||
        task.priority === "urgent")
  );

  const dueSoonTasks = parentTasks.filter(
    (task) =>
      !task.completed &&
      !overdueTasks.includes(task) && // Exclude overdue tasks
      !focusTasks.includes(task) && // Exclude focus tasks
      task.dueDate &&
      isFuture(new Date(task.dueDate)) &&
      !isToday(new Date(task.dueDate)) &&
      new Date(task.dueDate) <= addDays(new Date(), 7)
  );

  const backlogTasks = parentTasks.filter(
    (task) =>
      !task.completed &&
      !overdueTasks.includes(task) && // Exclude overdue tasks
      !focusTasks.includes(task) && // Exclude focus tasks
      !dueSoonTasks.includes(task) && // Exclude due soon tasks
      (!task.dueDate || new Date(task.dueDate) > addDays(new Date(), 7))
  );

  const completedTasks = parentTasks.filter(
    (task) =>
      task.completed &&
      task.completedAt &&
      task.completedAt.split("T")[0] === today
  );

  // Sort tasks by sortOrder for drag and drop
  const sortTasksByOrder = (taskList: Task[]) => {
    return [...taskList].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
  };

  return (
    <div className="w-full max-w-none">
      <div className="space-y-6">
        {/* Overdue tasks section - displayed first with high priority */}
        {overdueTasks.length > 0 && (
          <SortableTaskList
            tasks={sortTasksByOrder(overdueTasks)}
            title="Overdue"
            emoji="🚨"
          />
        )}

        {focusTasks.length > 0 && (
          <SortableTaskList
            tasks={sortTasksByOrder(focusTasks)}
            title="Focus for Today"
            emoji="⚡️"
          />
        )}

        {dueSoonTasks.length > 0 && (
          <SortableTaskList
            tasks={sortTasksByOrder(dueSoonTasks)}
            title="Due Soon"
            emoji="⏳"
          />
        )}

        {backlogTasks.length > 0 && (
          <SortableTaskList
            tasks={sortTasksByOrder(backlogTasks)}
            title="Backlog"
            emoji="🧠"
          />
        )}

        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <SortableTaskList
              tasks={sortTasksByOrder(completedTasks)}
              title="Completed"
              emoji="✅"
            />
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="mb-4">No tasks found matching the current filters</p>
            <Button
              onClick={() => setShowAddTask(true)}
              className="gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add New Task
            </Button>
          </div>
        )}
      </div>

      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        defaultDate={selectedDate}
      />
    </div>
  );
}
