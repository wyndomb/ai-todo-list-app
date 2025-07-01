"use client";

import { useTodoStore } from "@/lib/store";
import { TaskList } from "@/components/tasks/task-list";
import { Card, CardContent } from "@/components/ui/card";
import { Target, CheckCircle2, Clock } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";

export function Dashboard() {
  const { tasks } = useTodoStore();

  // Filter tasks for today - simple date-based logic
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(
    (task) => !task.parentId && task.dueDate === today
  );

  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const remainingTodayTasks = todayTasks.length - completedTodayTasks;
  const progress =
    todayTasks.length > 0
      ? Math.round((completedTodayTasks / todayTasks.length) * 100)
      : 0;

  return (
    <div className="space-y-4 animate-fade-in max-w-none pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Today's Focus 🌅
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {remainingTodayTasks > 0
            ? `${remainingTodayTasks} tasks to go`
            : "All tasks done!"}
        </p>
      </div>

      {/* Compact Progress Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="aspect-square md:aspect-auto bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-600">
          <CardContent className="p-3 md:p-4 h-full flex flex-col items-center justify-center">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Progress
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {progress}%
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square md:aspect-auto bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-600">
          <CardContent className="p-3 md:p-4 h-full flex flex-col items-center justify-center">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Completed
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completedTodayTasks}
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square md:aspect-auto bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-600">
          <CardContent className="p-3 md:p-4 h-full flex flex-col items-center justify-center">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
              Remaining
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {remainingTodayTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Task List */}
      <div className="w-full max-w-none">
        {tasks.length > 0 ? (
          <TaskList tasks={tasks} />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              All Clear!
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">
              You have no tasks. Enjoy your day!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
