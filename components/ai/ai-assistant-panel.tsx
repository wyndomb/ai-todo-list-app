"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useTodoStore } from "@/lib/store";
import { format, isToday, isPast, startOfDay, endOfDay } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Sparkles,
  Send,
  Zap,
  Loader2,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  Flame,
} from "lucide-react";
import { AIMessage } from "@/components/ai/ai-message";

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: string;
}

interface TaskDetail {
  id: string;
  title: string;
  category?: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
}

// Make all TaskSummary properties optional for dynamic context injection
interface TaskSummary {
  // Core metrics (always included)
  totalTasks?: number;
  completedTasks?: number;
  activeTasks?: number;
  completionRate?: number;
  streak?: number;

  // Today-specific data (for today_summary intent)
  completedToday?: number;
  dueToday?: number;
  completedTodayTasks?: TaskDetail[];
  dueTodayTasks?: TaskDetail[];

  // Priority-specific data (for prioritization_summary intent)
  overdueTasks?: TaskDetail[];
  highPriorityTasks?: TaskDetail[];
  urgentTasks?: TaskDetail[];

  // Productivity-specific data (for productivity_summary intent)
  tasksByCategory?: Record<string, number>;
  mostProductiveTime?: string;
  avgTasksPerDay?: number;
  recentCompletions?: TaskDetail[];

  // Upcoming-specific data (for upcoming_summary intent)
  upcomingTasks?: TaskDetail[];
  dueThisWeek?: TaskDetail[];
  dueNextWeek?: TaskDetail[];

  // Motivation-specific data (for motivation_summary intent)
  recentAchievements?: TaskDetail[];
  streakMilestones?: {
    current: number;
    next: number;
    daysToNext: number;
    bestStreak?: number;
  };
  weeklyProgress?: {
    thisWeek: number;
    lastWeek: number;
    improvement: number;
  };
  motivationalStats?: {
    tasksAheadOfSchedule: number;
    clearUrgentTasks: boolean;
    categoryBalance: Record<string, number>;
  };

  // Enhanced productivity data (for enhanced productivity_summary intent)
  historicalData?: {
    last30Days: DailyProductivityPoint[];
    weeklyTrends: WeeklyProductivityPoint[];
    monthlyComparisons: MonthlyComparison[];
    bestPerformancePeriod: string;
    productivityCurve: "improving" | "declining" | "stable" | "fluctuating";
  };
  productivityPatterns?: {
    mostProductiveDay: string;
    mostProductiveTimeFrame: string;
    completionVelocity: number;
    procrastinationPattern: {
      averageDelayDays: number;
      mostDelayedCategory: string;
    };
    consistencyScore: number;
  };
  categoryInsights?: {
    mostImproved: string;
    needsAttention: string[];
    balanceScore: number;
    categoryTrends: Record<string, "up" | "down" | "stable">;
  };
  performanceMetrics?: {
    personalBest: {
      dailyRecord: number;
      weeklyRecord: number;
      longestStreak: number;
    };
    recentImprovement: {
      comparedToLastMonth: number;
      improvementAreas: string[];
    };
  };

  // General data (for general queries)
  // These are included when we need broader context
}

// Supporting type definitions for enhanced productivity summary
interface DailyProductivityPoint {
  date: string;
  completed: number;
  created: number;
  completionRate: number;
  categories: Record<string, number>;
}

interface WeeklyProductivityPoint {
  weekStart: string;
  totalCompleted: number;
  dailyAverage: number;
  bestDay: string;
  worstDay: string;
  consistency: number;
}

interface MonthlyComparison {
  month: string;
  completed: number;
  completionRate: number;
  changeFromPrevious: number;
  topCategories: string[];
}

type UserIntent =
  | "today_summary"
  | "productivity_summary"
  | "prioritization_summary"
  | "add_task"
  | "overdue_analysis"
  | "upcoming_summary"
  | "motivation_summary"
  | "general";

export function AIAssistantPanel({ open, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      content: `Hi there! ✨ I'm your AI productivity coach. I can help you manage tasks, analyze your productivity patterns, and provide personalized insights. Try asking me:

- "What did I accomplish today?"
- "What's coming up?"
- "What should I prioritize?"
- "How's my streak?"
- "Motivate me!"
- "How's my productivity this week?"

How can I help you today?`,
      sender: "assistant",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { tasks, addTask, categories } = useTodoStore();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Helper function to convert task to TaskDetail
  const taskToDetail = (task: any): TaskDetail => ({
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
  });

  // Intent detection function
  const determineIntent = (userInput: string): UserIntent => {
    const lowerInput = userInput.toLowerCase();

    // Task creation intent - Enhanced pattern matching
    if (
      lowerInput.includes("add task") ||
      lowerInput.includes("create task") ||
      lowerInput.includes("new task") ||
      lowerInput.includes("make a task") ||
      lowerInput.includes("add a task") ||
      lowerInput.includes("create a task") ||
      lowerInput.includes("make task") ||
      lowerInput.startsWith("create ") ||
      lowerInput.startsWith("add ") ||
      (lowerInput.includes("create") && lowerInput.includes(":")) ||
      (lowerInput.includes("add") && lowerInput.includes(":"))
    ) {
      return "add_task";
    }

    // Today summary intent
    if (
      (lowerInput.includes("what did i") &&
        (lowerInput.includes("today") || lowerInput.includes("accomplish"))) ||
      lowerInput.includes("today's tasks") ||
      lowerInput.includes("completed today") ||
      (lowerInput.includes("today") &&
        (lowerInput.includes("do") || lowerInput.includes("schedule")))
    ) {
      return "today_summary";
    }

    // Prioritization intent
    if (
      lowerInput.includes("prioritize") ||
      lowerInput.includes("priority") ||
      lowerInput.includes("focus") ||
      lowerInput.includes("urgent") ||
      lowerInput.includes("what should i") ||
      lowerInput.includes("most important")
    ) {
      return "prioritization_summary";
    }

    // Overdue analysis intent
    if (
      lowerInput.includes("overdue") ||
      lowerInput.includes("late") ||
      lowerInput.includes("past due") ||
      lowerInput.includes("behind")
    ) {
      return "overdue_analysis";
    }

    // Upcoming/Future tasks intent
    if (
      lowerInput.includes("what's coming up") ||
      lowerInput.includes("whats coming up") ||
      lowerInput.includes("what's upcoming") ||
      lowerInput.includes("whats upcoming") ||
      lowerInput.includes("what's due this week") ||
      lowerInput.includes("whats due this week") ||
      lowerInput.includes("what's on my schedule") ||
      lowerInput.includes("whats on my schedule") ||
      lowerInput.includes("what do i have next") ||
      lowerInput.includes("what's next") ||
      lowerInput.includes("whats next") ||
      lowerInput.includes("upcoming tasks") ||
      lowerInput.includes("show me upcoming") ||
      lowerInput.includes("what's due soon") ||
      lowerInput.includes("whats due soon") ||
      lowerInput.includes("what's planned") ||
      lowerInput.includes("whats planned") ||
      lowerInput.includes("what's on deck") ||
      lowerInput.includes("whats on deck") ||
      (lowerInput.includes("upcoming") && !lowerInput.includes("overdue")) ||
      (lowerInput.includes("coming up") && !lowerInput.includes("overdue")) ||
      (lowerInput.includes("due") &&
        (lowerInput.includes("week") || lowerInput.includes("soon")))
    ) {
      return "upcoming_summary";
    }

    // Enhanced productivity analysis intent - Supporting trend analysis
    if (
      lowerInput.includes("productivity") ||
      lowerInput.includes("performance") ||
      lowerInput.includes("how am i doing") ||
      lowerInput.includes("progress") ||
      lowerInput.includes("completion rate") ||
      (lowerInput.includes("week") && !lowerInput.includes("due")) ||
      (lowerInput.includes("month") && !lowerInput.includes("due")) ||
      lowerInput.includes("trends") ||
      lowerInput.includes("patterns") ||
      lowerInput.includes("how was last week") ||
      lowerInput.includes("how's this week") ||
      lowerInput.includes("monthly overview") ||
      lowerInput.includes("am i getting better") ||
      lowerInput.includes("show me my trends") ||
      lowerInput.includes("productivity report") ||
      lowerInput.includes("when am i most productive") ||
      lowerInput.includes("which day is best") ||
      lowerInput.includes("how consistent am i") ||
      lowerInput.includes("what's my personal best") ||
      lowerInput.includes("compare to last month") ||
      lowerInput.includes("which categories need work") ||
      lowerInput.includes("what should i improve") ||
      lowerInput.includes("show me my records") ||
      lowerInput.includes("track my improvement") ||
      (lowerInput.includes("how") &&
        lowerInput.includes("vs") &&
        lowerInput.includes("week"))
    ) {
      return "productivity_summary";
    }

    // Motivation analysis intent - Streak & Achievement tracking
    if (
      lowerInput.includes("how's my streak") ||
      lowerInput.includes("what's my streak") ||
      lowerInput.includes("streak") ||
      lowerInput.includes("what's my record") ||
      lowerInput.includes("recent wins") ||
      lowerInput.includes("recent achievements") ||
      lowerInput.includes("celebrate my progress") ||
      lowerInput.includes("motivate me") ||
      lowerInput.includes("motivation") ||
      lowerInput.includes("success summary") ||
      lowerInput.includes("achievement highlights") ||
      lowerInput.includes("inspire me") ||
      lowerInput.includes("keep me going") ||
      lowerInput.includes("boost my morale") ||
      (lowerInput.includes("how") &&
        lowerInput.includes("doing") &&
        lowerInput.includes("streak"))
    ) {
      return "motivation_summary";
    }

    // Default to general intent
    return "general";
  };

  // Dynamic task summary generation based on intent
  const generateTaskSummary = (intent: UserIntent): TaskSummary => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // CRITICAL: Limit data sent to prevent API overload
    const MAX_TASKS_PER_ARRAY = 10; // Prevent token overflow
    const MAX_RECENT_COMPLETIONS = 5;

    // Always include core metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const activeTasks = tasks.filter((t) => !t.completed).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate streak (always useful for context) - Fixed infinite loop
    let streak = 0;
    let currentDate = new Date();
    let daysChecked = 0;
    const maxDaysToCheck = 30; // Safety limit to prevent infinite loops

    while (streak < 30 && daysChecked < maxDaysToCheck) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const hasCompletedTask = tasks.some(
        (task) =>
          task.completed &&
          task.completedAt &&
          task.completedAt.startsWith(dateStr)
      );

      if (!hasCompletedTask && streak > 0) break; // Break if no task found and we have a streak
      if (hasCompletedTask) streak++;

      currentDate.setDate(currentDate.getDate() - 1);
      daysChecked++; // Always increment to prevent infinite loop
    }

    const baseSummary: TaskSummary = {
      totalTasks,
      completedTasks,
      activeTasks,
      completionRate,
      streak,
    };

    switch (intent) {
      case "today_summary": {
        const completedTodayTasksArray = tasks
          .filter(
            (t) =>
              t.completed && t.completedAt && t.completedAt.startsWith(today)
          )
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Prevent overload
        const dueTodayTasksArray = tasks
          .filter((t) => t.dueDate === today && !t.completed)
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Prevent overload

        return {
          ...baseSummary,
          completedToday: tasks.filter(
            (t) =>
              t.completed && t.completedAt && t.completedAt.startsWith(today)
          ).length,
          dueToday: tasks.filter((t) => t.dueDate === today && !t.completed)
            .length,
          completedTodayTasks: completedTodayTasksArray.map(taskToDetail),
          dueTodayTasks: dueTodayTasksArray.map(taskToDetail),
        };
      }

      case "prioritization_summary": {
        const overdueTasksArray = tasks
          .filter((t) => t.dueDate && t.dueDate < today && !t.completed)
          .sort((a, b) => {
            // Sort by priority and due date
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            if (aPriority !== bPriority) return bPriority - aPriority;
            return (a.dueDate || "").localeCompare(b.dueDate || "");
          })
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Show most critical overdue tasks

        const highPriorityTasksArray = tasks
          .filter(
            (t) =>
              !t.completed && (t.priority === "high" || t.priority === "urgent")
          )
          .sort((a, b) => {
            const priorityOrder = { urgent: 2, high: 1 };
            return (
              (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
              (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
            );
          })
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Show highest priority tasks

        const urgentTasksArray = tasks
          .filter((t) => !t.completed && t.priority === "urgent")
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Prevent overload

        const dueTodayTasksArray = tasks
          .filter((t) => t.dueDate === today && !t.completed)
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Prevent overload

        return {
          ...baseSummary,
          overdueTasks: overdueTasksArray.map(taskToDetail),
          highPriorityTasks: highPriorityTasksArray.map(taskToDetail),
          urgentTasks: urgentTasksArray.map(taskToDetail),
          dueTodayTasks: dueTodayTasksArray.map(taskToDetail),
          dueToday: tasks.filter((t) => t.dueDate === today && !t.completed)
            .length,
        };
      }

      case "overdue_analysis": {
        const overdueTasksArray = tasks
          .filter((t) => t.dueDate && t.dueDate < today && !t.completed)
          .sort((a, b) => {
            // Sort by priority and due date
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            if (aPriority !== bPriority) return bPriority - aPriority;
            return (a.dueDate || "").localeCompare(b.dueDate || "");
          })
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Show most critical overdue tasks

        return {
          ...baseSummary,
          overdueTasks: overdueTasksArray.map(taskToDetail),
        };
      }

      case "productivity_summary": {
        // === STEP 2: Historical Data Processing ===

        // Generate 30-day historical data
        const last30Days: DailyProductivityPoint[] = Array.from(
          { length: 30 },
          (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];

            const dayTasks = tasks.filter(
              (t) => t.createdAt && t.createdAt.startsWith(dateStr)
            );
            const dayCompleted = tasks.filter(
              (t) =>
                t.completed &&
                t.completedAt &&
                t.completedAt.startsWith(dateStr)
            );
            const dayCategories = dayCompleted.reduce((acc, task) => {
              const category = task.category || "No Category";
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return {
              date: dateStr,
              completed: dayCompleted.length,
              created: dayTasks.length,
              completionRate:
                dayTasks.length > 0
                  ? Math.round((dayCompleted.length / dayTasks.length) * 100)
                  : 0,
              categories: dayCategories,
            };
          }
        ).reverse(); // Oldest to newest

        // Generate weekly trends (last 4 weeks)
        const weeklyTrends: WeeklyProductivityPoint[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - i * 7 - 6);
          const weekEnd = new Date();
          weekEnd.setDate(weekEnd.getDate() - i * 7);

          const weekStartStr = weekStart.toISOString().split("T")[0];
          const weekEndStr = weekEnd.toISOString().split("T")[0];

          const weekDays = last30Days.filter(
            (day) => day.date >= weekStartStr && day.date <= weekEndStr
          );
          const totalCompleted = weekDays.reduce(
            (sum, day) => sum + day.completed,
            0
          );
          const dailyAverage =
            weekDays.length > 0
              ? Math.round((totalCompleted / weekDays.length) * 10) / 10
              : 0;

          const bestDay = weekDays.reduce(
            (best, current) =>
              current.completed > best.completed ? current : best,
            weekDays[0] || { completed: 0, date: "" }
          );
          const worstDay = weekDays.reduce(
            (worst, current) =>
              current.completed < worst.completed ? current : worst,
            weekDays[0] || { completed: 0, date: "" }
          );

          // Calculate consistency (how close daily values are to average)
          const variance =
            weekDays.reduce(
              (sum, day) => sum + Math.pow(day.completed - dailyAverage, 2),
              0
            ) / weekDays.length;
          const consistency = Math.max(
            0,
            Math.round(100 - Math.sqrt(variance) * 10)
          );

          weeklyTrends.push({
            weekStart: weekStartStr,
            totalCompleted,
            dailyAverage,
            bestDay: bestDay.date,
            worstDay: worstDay.date,
            consistency,
          });
        }

        // Generate monthly comparisons (last 3 months)
        const monthlyComparisons: MonthlyComparison[] = [];
        for (let i = 2; i >= 0; i--) {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i, 1);
          const monthEnd = new Date();
          monthEnd.setMonth(monthEnd.getMonth() - i + 1, 0);

          const monthStartStr = monthStart.toISOString().split("T")[0];
          const monthEndStr = monthEnd.toISOString().split("T")[0];

          const monthTasks = tasks.filter(
            (t) =>
              t.completed &&
              t.completedAt &&
              t.completedAt >= monthStartStr &&
              t.completedAt <= monthEndStr
          );

          const topCategories = Object.entries(
            monthTasks.reduce((acc, task) => {
              const category = task.category || "No Category";
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat]) => cat);

          const previousMonth =
            i === 2
              ? 0
              : monthlyComparisons[monthlyComparisons.length - 1]?.completed ||
                0;

          monthlyComparisons.push({
            month: monthStart.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
            completed: monthTasks.length,
            completionRate:
              baseSummary.totalTasks && baseSummary.totalTasks > 0
                ? Math.round((monthTasks.length / baseSummary.totalTasks) * 100)
                : 0,
            changeFromPrevious:
              previousMonth > 0
                ? Math.round(
                    ((monthTasks.length - previousMonth) / previousMonth) * 100
                  )
                : 0,
            topCategories,
          });
        }

        // Determine productivity curve
        const recentWeeks = weeklyTrends.slice(-3);
        let productivityCurve:
          | "improving"
          | "declining"
          | "stable"
          | "fluctuating" = "stable";
        if (recentWeeks.length >= 2) {
          const trend =
            recentWeeks[recentWeeks.length - 1].totalCompleted -
            recentWeeks[0].totalCompleted;
          const variation =
            Math.max(...recentWeeks.map((w) => w.totalCompleted)) -
            Math.min(...recentWeeks.map((w) => w.totalCompleted));

          if (Math.abs(trend) < 2 && variation < 5)
            productivityCurve = "stable";
          else if (trend > 2) productivityCurve = "improving";
          else if (trend < -2) productivityCurve = "declining";
          else productivityCurve = "fluctuating";
        }

        // === STEP 3: Pattern Recognition Engine ===

        // Find most productive day of week
        const dayCompletions = last30Days.reduce((acc, day) => {
          const dayOfWeek = new Date(day.date).toLocaleDateString("en-US", {
            weekday: "long",
          });
          acc[dayOfWeek] = (acc[dayOfWeek] || 0) + day.completed;
          return acc;
        }, {} as Record<string, number>);

        const mostProductiveDay =
          Object.entries(dayCompletions).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0] || "Monday";

        // Calculate completion velocity (tasks per day trending)
        const recentDays = last30Days.slice(-7);
        const earlierDays = last30Days.slice(-14, -7);
        const recentAvg =
          recentDays.reduce((sum, day) => sum + day.completed, 0) /
          recentDays.length;
        const earlierAvg =
          earlierDays.reduce((sum, day) => sum + day.completed, 0) /
          earlierDays.length;
        const completionVelocity =
          Math.round((recentAvg - earlierAvg) * 10) / 10;

        // Calculate procrastination patterns
        const overdueTasks = tasks.filter(
          (t) => t.dueDate && t.dueDate < today && !t.completed
        );
        const completedDelayedTasks = tasks.filter(
          (t) =>
            t.completed &&
            t.dueDate &&
            t.completedAt &&
            t.completedAt.split("T")[0] > t.dueDate
        );

        const averageDelayDays =
          completedDelayedTasks.length > 0
            ? Math.round(
                completedDelayedTasks.reduce((sum, task) => {
                  const dueDate = new Date(task.dueDate!);
                  const completedDate = new Date(task.completedAt!);
                  return (
                    sum +
                    Math.max(
                      0,
                      (completedDate.getTime() - dueDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                }, 0) / completedDelayedTasks.length
              )
            : 0;

        const delayByCategory = completedDelayedTasks.reduce((acc, task) => {
          const category = task.category || "No Category";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostDelayedCategory =
          Object.entries(delayByCategory).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0] || "No Category";

        // Calculate consistency score
        const consistencyScore =
          weeklyTrends.length > 0
            ? Math.round(
                weeklyTrends.reduce((sum, week) => sum + week.consistency, 0) /
                  weeklyTrends.length
              )
            : 0;

        // === STEP 4: Category Intelligence ===

        const currentCategories = tasks.reduce((acc, task) => {
          const category = task.category || "No Category";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Compare with previous month to find trends
        const lastMonthTasks = tasks.filter((t) => {
          const taskDate = new Date(t.createdAt);
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return taskDate.getMonth() === lastMonth.getMonth();
        });

        const lastMonthCategories = lastMonthTasks.reduce((acc, task) => {
          const category = task.category || "No Category";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Determine category trends and insights
        const categoryTrends: Record<string, "up" | "down" | "stable"> = {};
        const improvementData: Array<{ category: string; change: number }> = [];

        Object.keys(currentCategories).forEach((category) => {
          const current = currentCategories[category] || 0;
          const previous = lastMonthCategories[category] || 0;
          const change = current - previous;

          if (Math.abs(change) <= 1) categoryTrends[category] = "stable";
          else if (change > 1) {
            categoryTrends[category] = "up";
            improvementData.push({ category, change });
          } else {
            categoryTrends[category] = "down";
          }
        });

        const mostImproved =
          improvementData.length > 0
            ? improvementData.sort((a, b) => b.change - a.change)[0].category
            : Object.keys(currentCategories)[0] || "No Category";

        const needsAttention = Object.entries(categoryTrends)
          .filter(([, trend]) => trend === "down")
          .map(([category]) => category)
          .slice(0, 3);

        // Calculate balance score (how evenly distributed tasks are across categories)
        const categoryValues = Object.values(currentCategories);
        const totalTasksForBalance = categoryValues.reduce(
          (sum, count) => sum + count,
          0
        );
        const idealPerCategory = totalTasksForBalance / categoryValues.length;
        const variance =
          categoryValues.reduce(
            (sum, count) => sum + Math.pow(count - idealPerCategory, 2),
            0
          ) / categoryValues.length;
        const balanceScore = Math.max(
          0,
          Math.round(100 - (Math.sqrt(variance) / idealPerCategory) * 20)
        );

        // === STEP 5: Performance Metrics ===

        // Calculate personal bests
        const dailyRecord = Math.max(
          ...last30Days.map((day) => day.completed),
          0
        );
        const weeklyRecord = Math.max(
          ...weeklyTrends.map((week) => week.totalCompleted),
          0
        );
        const longestStreak = streak; // We already calculate this in baseSummary

        // Calculate improvement vs last month
        const thisMonthCompleted =
          monthlyComparisons[monthlyComparisons.length - 1]?.completed || 0;
        const lastMonthCompleted =
          monthlyComparisons[monthlyComparisons.length - 2]?.completed || 0;
        const comparedToLastMonth =
          lastMonthCompleted > 0
            ? Math.round(
                ((thisMonthCompleted - lastMonthCompleted) /
                  lastMonthCompleted) *
                  100
              )
            : 0;

        const improvementAreas =
          needsAttention.length > 0
            ? needsAttention
            : ["Consistency", "Daily average", "Category balance"].slice(0, 2);

        // === Original Basic Data (for backward compatibility) ===
        const tasksByCategory = currentCategories;
        const recentCompletionsArray = tasks
          .filter((t) => t.completed && t.completedAt)
          .sort(
            (a, b) =>
              new Date(b.completedAt!).getTime() -
              new Date(a.completedAt!).getTime()
          )
          .slice(0, MAX_RECENT_COMPLETIONS);

        const avgTasksPerDay =
          recentDays.reduce((sum, day) => sum + day.completed, 0) /
          recentDays.length;
        const mostProductiveTime =
          completedTasks > 5 ? "Morning (9-11 AM)" : undefined;

        return {
          ...baseSummary,
          // Original basic data
          tasksByCategory,
          recentCompletions: recentCompletionsArray.map(taskToDetail),
          avgTasksPerDay: Math.round(avgTasksPerDay * 10) / 10,
          mostProductiveTime,
          // Enhanced productivity data
          historicalData: {
            last30Days: last30Days.slice(-10), // Limit to prevent token overflow
            weeklyTrends,
            monthlyComparisons,
            bestPerformancePeriod:
              weeklyTrends.length > 0
                ? weeklyTrends.reduce((best, current) =>
                    current.totalCompleted > best.totalCompleted
                      ? current
                      : best
                  ).weekStart
                : today,
            productivityCurve,
          },
          productivityPatterns: {
            mostProductiveDay,
            mostProductiveTimeFrame: mostProductiveTime || "Morning",
            completionVelocity,
            procrastinationPattern: {
              averageDelayDays,
              mostDelayedCategory,
            },
            consistencyScore,
          },
          categoryInsights: {
            mostImproved,
            needsAttention,
            balanceScore,
            categoryTrends,
          },
          performanceMetrics: {
            personalBest: {
              dailyRecord,
              weeklyRecord,
              longestStreak,
            },
            recentImprovement: {
              comparedToLastMonth,
              improvementAreas,
            },
          },
        };
      }

      case "upcoming_summary": {
        // Calculate date ranges for upcoming tasks
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        // Get end of this week (Sunday)
        const endOfWeek = new Date();
        const daysUntilSunday = 7 - endOfWeek.getDay();
        endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
        const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

        // Get end of next week
        const endOfNextWeek = new Date(endOfWeek);
        endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
        const endOfNextWeekStr = endOfNextWeek.toISOString().split("T")[0];

        // Filter and sort upcoming tasks by date and priority
        const upcomingTasksArray = tasks
          .filter((t) => t.dueDate && t.dueDate > today && !t.completed)
          .sort((a, b) => {
            // Sort by due date first, then by priority
            const dateComparison = (a.dueDate || "").localeCompare(
              b.dueDate || ""
            );
            if (dateComparison !== 0) return dateComparison;

            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            return bPriority - aPriority;
          })
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Prevent overload

        // Tasks due this week (today through end of week)
        const dueThisWeekArray = tasks
          .filter(
            (t) =>
              t.dueDate &&
              t.dueDate >= today &&
              t.dueDate <= endOfWeekStr &&
              !t.completed
          )
          .sort((a, b) => {
            const dateComparison = (a.dueDate || "").localeCompare(
              b.dueDate || ""
            );
            if (dateComparison !== 0) return dateComparison;

            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            return bPriority - aPriority;
          })
          .slice(0, MAX_TASKS_PER_ARRAY);

        // Tasks due next week
        const dueNextWeekArray = tasks
          .filter(
            (t) =>
              t.dueDate &&
              t.dueDate > endOfWeekStr &&
              t.dueDate <= endOfNextWeekStr &&
              !t.completed
          )
          .sort((a, b) => {
            const dateComparison = (a.dueDate || "").localeCompare(
              b.dueDate || ""
            );
            if (dateComparison !== 0) return dateComparison;

            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            return bPriority - aPriority;
          })
          .slice(0, MAX_TASKS_PER_ARRAY);

        return {
          ...baseSummary,
          upcomingTasks: upcomingTasksArray.map(taskToDetail),
          dueThisWeek: dueThisWeekArray.map(taskToDetail),
          dueNextWeek: dueNextWeekArray.map(taskToDetail),
        };
      }

      case "motivation_summary": {
        // Get recent achievements (completed tasks in last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split("T")[0];
        });

        const recentAchievementsArray = tasks
          .filter(
            (t) =>
              t.completed &&
              t.completedAt &&
              last7Days.some((date) => t.completedAt!.startsWith(date))
          )
          .sort(
            (a, b) =>
              new Date(b.completedAt!).getTime() -
              new Date(a.completedAt!).getTime()
          )
          .slice(0, MAX_TASKS_PER_ARRAY); // LIMIT: Recent achievements

        // Calculate streak milestones
        const streakMilestones = {
          current: streak,
          next:
            streak < 5
              ? 5
              : streak < 10
              ? 10
              : streak < 15
              ? 15
              : streak < 30
              ? 30
              : streak + 10,
          daysToNext:
            streak < 5
              ? 5 - streak
              : streak < 10
              ? 10 - streak
              : streak < 15
              ? 15 - streak
              : streak < 30
              ? 30 - streak
              : 10,
          bestStreak: streak, // For now, current streak is the best (could be enhanced with historical data)
        };

        // Calculate weekly progress
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const thisWeekStartStr = thisWeekStart.toISOString().split("T")[0];

        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekStartStr = lastWeekStart.toISOString().split("T")[0];
        const lastWeekEndStr = new Date(thisWeekStart.getTime() - 1)
          .toISOString()
          .split("T")[0];

        const thisWeekCompleted = tasks.filter(
          (t) =>
            t.completed && t.completedAt && t.completedAt >= thisWeekStartStr
        ).length;

        const lastWeekCompleted = tasks.filter(
          (t) =>
            t.completed &&
            t.completedAt &&
            t.completedAt >= lastWeekStartStr &&
            t.completedAt <= lastWeekEndStr
        ).length;

        const weeklyImprovement = thisWeekCompleted - lastWeekCompleted;

        // Calculate motivational stats
        const tasksAheadOfSchedule = tasks.filter(
          (t) =>
            t.completed &&
            t.dueDate &&
            t.completedAt &&
            new Date(t.completedAt).getTime() < new Date(t.dueDate).getTime()
        ).length;

        const clearUrgentTasks =
          tasks.filter((t) => !t.completed && t.priority === "urgent")
            .length === 0;

        const categoryBalance = tasks.reduce((acc, task) => {
          const category = task.category || "No Category";
          if (task.completed) {
            acc[category] = (acc[category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        return {
          ...baseSummary,
          recentAchievements: recentAchievementsArray.map(taskToDetail),
          streakMilestones,
          weeklyProgress: {
            thisWeek: thisWeekCompleted,
            lastWeek: lastWeekCompleted,
            improvement: weeklyImprovement,
          },
          motivationalStats: {
            tasksAheadOfSchedule,
            clearUrgentTasks,
            categoryBalance,
          },
        };
      }

      case "add_task": {
        // For task creation, we only need minimal context
        return baseSummary;
      }

      case "general":
      default: {
        // For general queries, include LIMITED context to prevent overload
        const completedTodayTasksArray = tasks
          .filter(
            (t) =>
              t.completed && t.completedAt && t.completedAt.startsWith(today)
          )
          .slice(0, 5); // LIMIT: Only show recent completions

        const dueTodayTasksArray = tasks
          .filter((t) => t.dueDate === today && !t.completed)
          .slice(0, 5); // LIMIT: Only show most important due today

        const overdueTasksArray = tasks
          .filter((t) => t.dueDate && t.dueDate < today && !t.completed)
          .sort((a, b) => {
            // Sort by priority and due date for most critical first
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
            if (aPriority !== bPriority) return bPriority - aPriority;
            return (a.dueDate || "").localeCompare(b.dueDate || "");
          })
          .slice(0, 5); // LIMIT: Only show most critical overdue

        return {
          ...baseSummary,
          completedToday: tasks.filter(
            (t) =>
              t.completed && t.completedAt && t.completedAt.startsWith(today)
          ).length,
          dueToday: tasks.filter((t) => t.dueDate === today && !t.completed)
            .length,
          completedTodayTasks: completedTodayTasksArray.map(taskToDetail),
          dueTodayTasks: dueTodayTasksArray.map(taskToDetail),
          overdueTasks: overdueTasksArray.map(taskToDetail),
        };
      }
    }
  };

  // Generate enhanced coaching responses based on user intent and task data
  const generateEnhancedBuiltInResponse = (
    userInput: string,
    summary: TaskSummary
  ) => {
    const lowerInput = userInput.toLowerCase();

    // Upcoming tasks queries
    if (
      lowerInput.includes("coming up") ||
      lowerInput.includes("upcoming") ||
      lowerInput.includes("what's next") ||
      lowerInput.includes("whats next") ||
      lowerInput.includes("due this week") ||
      lowerInput.includes("due soon") ||
      lowerInput.includes("on my schedule") ||
      lowerInput.includes("planned")
    ) {
      if (!summary.upcomingTasks || summary.upcomingTasks.length === 0) {
        let response = `📅 **Upcoming Schedule:**\n\nYou don't have any upcoming tasks with due dates set.`;

        if (summary.activeTasks && summary.activeTasks > 0) {
          response += ` However, you have ${summary.activeTasks} active task${
            summary.activeTasks === 1 ? "" : "s"
          } without specific due dates.`;
        }

        response += `\n\n💡 **Suggestion:** Consider adding due dates to your tasks to better plan your week!`;
        return response;
      }

      let response = `📅 **What's Coming Up:**\n\n`;

      // Show tasks due this week
      if (summary.dueThisWeek && summary.dueThisWeek.length > 0) {
        response += `📍 **This Week (${summary.dueThisWeek.length} task${
          summary.dueThisWeek.length === 1 ? "" : "s"
        }):**\n`;

        // Group by date
        const tasksByDate = summary.dueThisWeek.reduce((acc, task) => {
          const date = task.dueDate || "No date";
          if (!acc[date]) acc[date] = [];
          acc[date].push(task);
          return acc;
        }, {} as Record<string, TaskDetail[]>);

        Object.entries(tasksByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([date, tasks]) => {
            const formattedDate =
              date !== "No date"
                ? format(new Date(date), "EEEE, MMM dd")
                : "No specific date";
            response += `\n**${formattedDate}:**\n`;

            tasks.forEach((task) => {
              const priorityEmoji =
                task.priority === "urgent"
                  ? "🚨"
                  : task.priority === "high"
                  ? "🔥"
                  : task.priority === "medium"
                  ? "⚡"
                  : "📝";
              response += `${priorityEmoji} "${task.title}"${
                task.category ? ` (${task.category})` : ""
              } [${task.priority}]\n`;
            });
          });
      }

      // Show tasks due next week if any
      if (summary.dueNextWeek && summary.dueNextWeek.length > 0) {
        response += `\n🔮 **Next Week Preview (${
          summary.dueNextWeek.length
        } task${summary.dueNextWeek.length === 1 ? "" : "s"}):**\n`;

        summary.dueNextWeek.slice(0, 5).forEach((task) => {
          const priorityEmoji =
            task.priority === "urgent"
              ? "🚨"
              : task.priority === "high"
              ? "🔥"
              : task.priority === "medium"
              ? "⚡"
              : "📝";
          response += `${priorityEmoji} "${task.title}"${
            task.dueDate ? ` - ${format(new Date(task.dueDate), "MMM dd")}` : ""
          }${task.category ? ` (${task.category})` : ""}\n`;
        });

        if (summary.dueNextWeek.length > 5) {
          response += `... and ${
            summary.dueNextWeek.length - 5
          } more tasks next week\n`;
        }
      }

      // Summary and advice
      const totalUpcoming =
        (summary.dueThisWeek?.length || 0) + (summary.dueNextWeek?.length || 0);
      const highPriorityCount =
        summary.upcomingTasks?.filter(
          (t) => t.priority === "urgent" || t.priority === "high"
        ).length || 0;

      response += `\n📊 **Week Overview:** ${totalUpcoming} total upcoming tasks`;
      if (highPriorityCount > 0) {
        response += `, ${highPriorityCount} high priority`;
      }

      if (highPriorityCount > 3) {
        response += `\n\n⚠️ **Note:** You have quite a few high-priority tasks coming up. Consider spreading some out if possible.`;
      } else {
        response += `\n\n✨ **Looking good!** Your upcoming schedule seems manageable.`;
      }

      return response;
    }

    // Productivity analysis queries with specific task details
    if (
      lowerInput.includes("what did i") &&
      (lowerInput.includes("today") || lowerInput.includes("accomplish"))
    ) {
      if (!summary.completedToday || summary.completedToday === 0) {
        let response = `📊 **Today's Summary:**\n\nYou haven't completed any tasks today yet, but don't worry!`;

        if (summary.dueToday && summary.dueToday > 0 && summary.dueTodayTasks) {
          response += `\n\n📅 **Tasks due today:**`;
          summary.dueTodayTasks.forEach((task) => {
            const priorityEmoji =
              task.priority === "urgent"
                ? "🚨"
                : task.priority === "high"
                ? "🔥"
                : task.priority === "medium"
                ? "⚡"
                : "📝";
            response += `\n${priorityEmoji} "${task.title}"${
              task.category ? ` (${task.category})` : ""
            }`;
          });
        }

        if (summary.overdueTasks && summary.overdueTasks.length > 0) {
          response += `\n\n⚠️ **Overdue tasks that need attention:**`;
          summary.overdueTasks.slice(0, 3).forEach((task) => {
            response += `\n🚨 "${task.title}"${
              task.dueDate && task.dueDate.length > 0
                ? ` (was due ${format(new Date(task.dueDate), "MMM dd")})`
                : ""
            }`;
          });
          if (summary.overdueTasks.length > 3) {
            response += `\n... and ${
              summary.overdueTasks.length - 3
            } more overdue tasks`;
          }
        }

        response += `\n\n💪 **Suggestion:** Start with your highest priority tasks to build momentum!`;
        return response;
      } else {
        let response = `🎉 **Great work today!**\n\n✅ **You've completed ${
          summary.completedToday
        } task${summary.completedToday === 1 ? "" : "s"} today:**\n`;

        if (summary.completedTodayTasks) {
          summary.completedTodayTasks.forEach((task) => {
            const timeCompleted =
              task.completedAt && task.completedAt.length > 0
                ? format(new Date(task.completedAt), "h:mm a")
                : "";
            response += `\n• "${task.title}"${
              task.category ? ` (${task.category})` : ""
            }${timeCompleted ? ` - completed at ${timeCompleted}` : ""}`;
          });
        }

        response += `\n\n📈 **Overall completion rate:** ${
          summary.completionRate
        }%\n🔥 **Current streak:** ${summary.streak} day${
          summary.streak === 1 ? "" : "s"
        }`;

        if (summary.dueToday && summary.dueToday > 0 && summary.dueTodayTasks) {
          response += `\n\n📋 **Still due today:**`;
          summary.dueTodayTasks.forEach((task) => {
            const priorityEmoji =
              task.priority === "urgent"
                ? "🚨"
                : task.priority === "high"
                ? "🔥"
                : task.priority === "medium"
                ? "⚡"
                : "📝";
            response += `\n${priorityEmoji} "${task.title}"${
              task.category ? ` (${task.category})` : ""
            }`;
          });
        } else {
          response += `\n\n🎯 All caught up for today!`;
        }

        response += `\n\nKeep up the excellent work! 🚀`;
        return response;
      }
    }

    if (
      lowerInput.includes("productivity") &&
      (lowerInput.includes("week") ||
        lowerInput.includes("month") ||
        lowerInput.includes("level"))
    ) {
      const productivityLevel =
        (summary.completionRate || 0) >= 80
          ? "Excellent"
          : (summary.completionRate || 0) >= 60
          ? "Good"
          : (summary.completionRate || 0) >= 40
          ? "Fair"
          : "Needs Improvement";

      let response = `📊 **Productivity Analysis:**\n\n🎯 **Overall Performance:** ${productivityLevel} (${
        summary.completionRate
      }% completion rate)\n📈 **Tasks completed:** ${
        summary.completedTasks
      } out of ${summary.totalTasks}\n🔥 **Current streak:** ${
        summary.streak
      } day${summary.streak === 1 ? "" : "s"}`;

      if (summary.avgTasksPerDay) {
        response += `\n📅 **Daily average:** ${summary.avgTasksPerDay} tasks per day`;
      }

      if (summary.recentCompletions && summary.recentCompletions.length > 0) {
        response += `\n\n✅ **Recent accomplishments:**`;
        summary.recentCompletions.forEach((task) => {
          const timeAgo =
            task.completedAt && task.completedAt.length > 0
              ? format(new Date(task.completedAt), "MMM dd")
              : "";
          response += `\n• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${timeAgo ? ` - ${timeAgo}` : ""}`;
        });
      }

      if (summary.tasksByCategory) {
        response += `\n\n**Category Breakdown:**\n${Object.entries(
          summary.tasksByCategory
        )
          .map(([cat, count]) => `• ${cat}: ${count} tasks`)
          .join("\n")}`;
      }

      response += `\n\n${
        (summary.completionRate || 0) >= 70
          ? "🌟 You're doing great! Keep maintaining this momentum."
          : "💡 **Tip:** Try breaking down larger tasks into smaller, manageable chunks to boost your completion rate."
      }`;
      return response;
    }

    if (
      lowerInput.includes("prioritize") ||
      lowerInput.includes("priority") ||
      lowerInput.includes("focus")
    ) {
      let priorityAdvice = "🎯 **Priority Recommendations:**\n\n";

      if (summary.overdueTasks && summary.overdueTasks.length > 0) {
        priorityAdvice += `🚨 **URGENT - Overdue Tasks:**`;
        summary.overdueTasks.slice(0, 3).forEach((task) => {
          priorityAdvice += `\n• "${task.title}"${
            task.dueDate && task.dueDate.length > 0
              ? ` (was due ${format(new Date(task.dueDate), "MMM dd")})`
              : ""
          }${task.category ? ` - ${task.category}` : ""}`;
        });
        if (summary.overdueTasks.length > 3) {
          priorityAdvice += `\n• ... and ${
            summary.overdueTasks.length - 3
          } more overdue tasks`;
        }
        priorityAdvice += `\n\n`;
      }

      if (summary.urgentTasks && summary.urgentTasks.length > 0) {
        priorityAdvice += `⚡ **High Priority - Urgent Tasks:**`;
        summary.urgentTasks.forEach((task) => {
          priorityAdvice += `\n• "${task.title}"${
            task.dueDate && task.dueDate.length > 0
              ? ` (due ${format(new Date(task.dueDate), "MMM dd")})`
              : ""
          }${task.category ? ` - ${task.category}` : ""}`;
        });
        priorityAdvice += `\n\n`;
      }

      if (summary.dueToday && summary.dueToday > 0 && summary.dueTodayTasks) {
        priorityAdvice += `📅 **Due Today:**`;
        summary.dueTodayTasks.forEach((task) => {
          const priorityEmoji =
            task.priority === "urgent"
              ? "🚨"
              : task.priority === "high"
              ? "🔥"
              : task.priority === "medium"
              ? "⚡"
              : "📝";
          priorityAdvice += `\n${priorityEmoji} "${task.title}"${
            task.category ? ` - ${task.category}` : ""
          }`;
        });
        priorityAdvice += `\n\n`;
      }

      if (
        (!summary.overdueTasks || summary.overdueTasks.length === 0) &&
        (!summary.urgentTasks || summary.urgentTasks.length === 0) &&
        (!summary.dueToday || summary.dueToday === 0)
      ) {
        priorityAdvice +=
          "✨ Great news! No urgent or overdue tasks. Focus on your high-priority items or plan ahead.\n\n";
      }

      priorityAdvice += `💡 **Strategy:** ${
        summary.mostProductiveTime
          ? `Work on important tasks during your most productive time (${summary.mostProductiveTime}).`
          : "Start with quick wins to build momentum, then tackle larger tasks."
      }`;

      return priorityAdvice;
    }

    // Enhanced overdue analysis with specific tasks
    if (lowerInput.includes("overdue")) {
      if (!summary.overdueTasks || summary.overdueTasks.length === 0) {
        return "🎉 **Excellent!** You don't have any overdue tasks. You're staying on top of things!\n\n✨ This is a great sign of good time management. Keep up the momentum!";
      } else {
        let response = `⚠️ **Overdue Tasks Alert**\n\nYou have ${
          summary.overdueTasks.length
        } overdue task${summary.overdueTasks.length > 1 ? "s" : ""}:\n\n`;

        summary.overdueTasks.forEach((task) => {
          const daysPast =
            task.dueDate && task.dueDate.length > 0
              ? Math.floor(
                  (new Date().getTime() - new Date(task.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;
          const priorityEmoji =
            task.priority === "urgent"
              ? "🚨"
              : task.priority === "high"
              ? "🔥"
              : task.priority === "medium"
              ? "⚡"
              : "📝";
          response += `${priorityEmoji} "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${
            daysPast > 0
              ? ` - ${daysPast} day${daysPast > 1 ? "s" : ""} overdue`
              : ""
          }\n`;
        });

        response += `\n💡 **Recommendation:** Tackle the highest priority overdue tasks first to get back on track.`;

        return response;
      }
    }

    // Enhanced Productivity Analysis - Comprehensive trends and insights
    if (
      lowerInput.includes("productivity") ||
      lowerInput.includes("trends") ||
      lowerInput.includes("patterns") ||
      lowerInput.includes("how was last week") ||
      lowerInput.includes("how's this week") ||
      lowerInput.includes("monthly overview") ||
      lowerInput.includes("am i getting better") ||
      lowerInput.includes("show me my trends") ||
      lowerInput.includes("productivity report") ||
      lowerInput.includes("when am i most productive") ||
      lowerInput.includes("which day is best") ||
      lowerInput.includes("how consistent am i") ||
      lowerInput.includes("what's my personal best") ||
      lowerInput.includes("compare to last month") ||
      lowerInput.includes("which categories need work") ||
      lowerInput.includes("what should i improve") ||
      lowerInput.includes("show me my records") ||
      lowerInput.includes("track my improvement")
    ) {
      let response = `📊 **Enhanced Productivity Analysis**\n\n`;

      // Performance Overview
      if (summary.performanceMetrics) {
        const { personalBest, recentImprovement } = summary.performanceMetrics;
        response += `🏆 **Performance Highlights:**\n`;
        response += `• Best single day: ${personalBest.dailyRecord} tasks\n`;
        response += `• Best week ever: ${personalBest.weeklyRecord} tasks\n`;
        response += `• Longest streak: ${personalBest.longestStreak} days\n`;

        if (recentImprovement.comparedToLastMonth !== 0) {
          const trend =
            recentImprovement.comparedToLastMonth > 0 ? "up" : "down";
          const emoji = trend === "up" ? "📈" : "📉";
          response += `${emoji} vs Last Month: ${Math.abs(
            recentImprovement.comparedToLastMonth
          )}% ${trend}\n`;
        }
        response += `\n`;
      }

      // Productivity Curve & Trends
      if (summary.historicalData) {
        const { productivityCurve, weeklyTrends, monthlyComparisons } =
          summary.historicalData;

        response += `📈 **Trend Analysis:**\n`;
        const curveEmoji =
          {
            improving: "🚀",
            declining: "📉",
            stable: "📊",
            fluctuating: "🔄",
          }[productivityCurve] || "📊";

        const curveText =
          {
            improving: "Improving steadily",
            declining: "Needs attention",
            stable: "Consistent performance",
            fluctuating: "Variable performance",
          }[productivityCurve] || "Stable";

        response += `${curveEmoji} **Overall Trajectory:** ${curveText}\n`;

        if (weeklyTrends.length >= 2) {
          const lastWeek = weeklyTrends[weeklyTrends.length - 1];
          const prevWeek = weeklyTrends[weeklyTrends.length - 2];
          const weekChange = lastWeek.totalCompleted - prevWeek.totalCompleted;

          response += `📅 **This Week vs Last:** ${
            weekChange >= 0 ? "+" : ""
          }${weekChange} tasks`;
          response += ` (${lastWeek.dailyAverage}/day average)\n`;
        }

        if (monthlyComparisons.length >= 2) {
          const thisMonth = monthlyComparisons[monthlyComparisons.length - 1];
          response += `📆 **${thisMonth.month}:** ${thisMonth.completed} tasks completed`;
          if (thisMonth.changeFromPrevious !== 0) {
            response += ` (${thisMonth.changeFromPrevious > 0 ? "+" : ""}${
              thisMonth.changeFromPrevious
            }%)`;
          }
          response += `\n`;
        }
        response += `\n`;
      }

      // Pattern Recognition
      if (summary.productivityPatterns) {
        const {
          mostProductiveDay,
          consistencyScore,
          completionVelocity,
          procrastinationPattern,
        } = summary.productivityPatterns;

        response += `🎯 **Pattern Insights:**\n`;
        response += `• **Most Productive Day:** ${mostProductiveDay}\n`;
        response += `• **Consistency Score:** ${consistencyScore}% `;

        if (consistencyScore >= 80) response += "(Excellent! 🌟)\n";
        else if (consistencyScore >= 60) response += "(Good 👍)\n";
        else response += "(Room for improvement 💪)\n";

        if (completionVelocity !== 0) {
          const velocityEmoji = completionVelocity > 0 ? "⚡" : "🔄";
          response += `${velocityEmoji} **Velocity Trend:** ${
            completionVelocity > 0 ? "+" : ""
          }${completionVelocity} tasks/day\n`;
        }

        if (procrastinationPattern.averageDelayDays > 0) {
          response += `⏰ **Procrastination Pattern:** ${procrastinationPattern.averageDelayDays} day avg delay`;
          response += ` (${procrastinationPattern.mostDelayedCategory} needs attention)\n`;
        }
        response += `\n`;
      }

      // Category Intelligence
      if (summary.categoryInsights) {
        const { mostImproved, needsAttention, balanceScore, categoryTrends } =
          summary.categoryInsights;

        response += `📋 **Category Intelligence:**\n`;
        response += `🏆 **Most Improved:** ${mostImproved}\n`;

        if (needsAttention.length > 0) {
          response += `⚠️ **Needs Attention:** ${needsAttention.join(", ")}\n`;
        }

        response += `⚖️ **Balance Score:** ${balanceScore}% `;
        if (balanceScore >= 80) response += "(Well-balanced! 🎯)\n";
        else if (balanceScore >= 60) response += "(Fairly balanced 👌)\n";
        else response += "(Consider diversifying 🔄)\n";

        const trendingUp = Object.entries(categoryTrends).filter(
          ([, trend]) => trend === "up"
        );
        if (trendingUp.length > 0) {
          response += `📈 **Growing:** ${trendingUp
            .map(([cat]) => cat)
            .join(", ")}\n`;
        }
        response += `\n`;
      }

      // Smart Recommendations
      response += `💡 **Smart Recommendations:**\n`;

      if (summary.productivityPatterns?.mostProductiveDay) {
        response += `• Schedule important tasks on ${summary.productivityPatterns.mostProductiveDay}s\n`;
      }

      if (
        summary.productivityPatterns?.consistencyScore &&
        summary.productivityPatterns.consistencyScore < 70
      ) {
        response += `• Focus on building consistent daily habits\n`;
      }

      if (summary.categoryInsights?.needsAttention.length) {
        response += `• Dedicate more time to: ${summary.categoryInsights.needsAttention[0]}\n`;
      }

      if (summary.historicalData?.productivityCurve === "declining") {
        response += `• Consider reviewing your task load and priorities\n`;
      } else if (summary.historicalData?.productivityCurve === "improving") {
        response += `• Keep up the momentum - you're on the right track! 🚀\n`;
      }

      return response;
    }

    // Motivation & streak analysis - Enhanced with achievements
    if (
      lowerInput.includes("motivation") ||
      lowerInput.includes("streak") ||
      lowerInput.includes("motivate me") ||
      lowerInput.includes("inspire me") ||
      lowerInput.includes("recent wins") ||
      lowerInput.includes("achievements") ||
      lowerInput.includes("celebrate") ||
      lowerInput.includes("boost my morale") ||
      lowerInput.includes("keep me going")
    ) {
      const currentStreak = summary.streak || 0;
      let response = `🔥 **Streak Status:** ${currentStreak} day${
        currentStreak === 1 ? "" : "s"
      } strong!\n\n`;

      // Streak milestone information
      if (summary.streakMilestones) {
        const { current, next, daysToNext } = summary.streakMilestones;

        if (current >= 7) {
          response += `🏆 **Amazing Achievement:** You've maintained a ${current}-day completion streak!\n\n`;
        } else if (current >= 3) {
          response += `💪 **Building Momentum:** ${current} days of consistent progress!\n\n`;
        } else if (current >= 1) {
          response += `🌟 **Great Start:** You're building a completion habit!\n\n`;
        }

        if (daysToNext > 0) {
          response += `🎯 **Next Milestone:** ${next}-day streak (${daysToNext} day${
            daysToNext === 1 ? "" : "s"
          } to go!)\n\n`;
        }
      }

      // Recent achievements
      if (summary.recentAchievements && summary.recentAchievements.length > 0) {
        response += `🏆 **Recent Wins (Last 7 Days):**\n`;
        summary.recentAchievements.slice(0, 5).forEach((task) => {
          const completedDate = task.completedAt
            ? format(new Date(task.completedAt), "MMM dd")
            : "";
          response += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${completedDate ? ` - ${completedDate}` : ""}\n`;
        });

        if (summary.recentAchievements.length > 5) {
          response += `• ... and ${
            summary.recentAchievements.length - 5
          } more achievements!\n`;
        }
        response += `\n`;
      }

      // Weekly progress comparison
      if (summary.weeklyProgress) {
        const { thisWeek, lastWeek, improvement } = summary.weeklyProgress;
        response += `📊 **Weekly Progress:**\n`;
        response += `• This week: ${thisWeek} tasks completed\n`;
        response += `• Last week: ${lastWeek} tasks completed\n`;

        if (improvement > 0) {
          response += `📈 **Improvement:** +${improvement} tasks (${Math.round(
            (improvement / Math.max(lastWeek, 1)) * 100
          )}% better!)\n\n`;
        } else if (improvement < 0) {
          response += `📉 **Change:** ${improvement} tasks (still making progress!)\n\n`;
        } else {
          response += `➡️ **Consistent:** Same pace as last week\n\n`;
        }
      }

      // Motivational stats
      if (summary.motivationalStats) {
        const { tasksAheadOfSchedule, clearUrgentTasks, categoryBalance } =
          summary.motivationalStats;

        if (tasksAheadOfSchedule > 0) {
          response += `⏰ **Early Bird:** You've completed ${tasksAheadOfSchedule} task${
            tasksAheadOfSchedule === 1 ? "" : "s"
          } ahead of schedule!\n`;
        }

        if (clearUrgentTasks) {
          response += `✨ **Clear Deck:** No urgent tasks pending - you're ahead of the game!\n`;
        }

        if (Object.keys(categoryBalance).length > 1) {
          const topCategory = Object.entries(categoryBalance).sort(
            ([, a], [, b]) => b - a
          )[0];
          if (topCategory) {
            response += `🎯 **Focus Area:** You've been most productive in ${topCategory[0]} (${topCategory[1]} tasks)\n`;
          }
        }
      }

      // Motivational message based on performance
      if (currentStreak >= 7) {
        response += `\n💫 **You're unstoppable!** A week-long streak shows incredible dedication. This momentum will take you far!`;
      } else if (currentStreak >= 3) {
        response += `\n🚀 **You're building something amazing!** Consistency is the key to success, and you're proving it!`;
      } else if (currentStreak >= 1) {
        response += `\n⭐ **Every journey starts with a single step!** You're building a powerful habit. Keep going!`;
      } else {
        response += `\n🌱 **Ready for a fresh start?** Today is perfect to begin your productivity streak. You've got this!`;
      }

      return response;
    }

    // General fallback response
    return "I'm here to help you stay productive! You can ask me about:\n• What you accomplished today\n• Your productivity level\n• Task prioritization advice\n• Overdue task analysis\n• Your streak and motivation\n• Or just tell me to add a task for you! 🚀";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: input.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsTyping(true);

    try {
      // Determine user intent and generate targeted task summary
      const intent = determineIntent(currentInput);
      const taskSummary = generateTaskSummary(intent);

      console.log(`Detected intent: ${intent} for input: "${currentInput}"`, {
        taskSummary,
        taskSummarySize: JSON.stringify(taskSummary).length,
        totalTasksInStore: tasks.length,
      }); // Enhanced debug log

      // SAFETY CHECK: Prevent sending massive payloads
      const payload = {
        message: currentInput,
        taskSummary: taskSummary,
        intent: intent,
      };
      const payloadSize = JSON.stringify(payload).length;
      console.log(`📦 Payload size: ${payloadSize} characters`);

      if (payloadSize > 15000) {
        // Safety limit
        console.warn(
          `⚠️ Payload too large (${payloadSize} chars), using fallback response`
        );
        const fallbackResponse = generateEnhancedBuiltInResponse(
          currentInput,
          taskSummary
        );
        const aiMessage: Message = {
          id: uuidv4(),
          content:
            fallbackResponse +
            "\n\n*Note: Using local response due to large data size.*",
          sender: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        return; // Exit early with fallback
      }

      // Try to use OpenAI API first
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("API request failed:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = "";

      // PRIORITIZE ERROR HANDLING
      if (data.error) {
        console.warn("API returned an error:", data.error);
        aiResponse =
          data.message ||
          "I ran into a little trouble. Please check the configuration or try again.";
      } else if (data.fallback) {
        // Handle cases where the API suggests a fallback to built-in responses
        aiResponse = generateEnhancedBuiltInResponse(currentInput, taskSummary);
      } else if (data.success && data.data) {
        // Handle successful OpenAI response
        if (data.data.task && intent === "add_task") {
          // ONLY create tasks when the intent is actually task creation
          await addTask(data.data.task);
          aiResponse =
            data.data.message || "I've created that task for you! ✨";
        } else if (data.data.task && intent !== "add_task") {
          // PREVENT task creation for coaching questions
          console.warn(
            `🚫 Blocked task creation for intent: ${intent}. OpenAI tried to create: "${data.data.task.title}"`
          );

          // Use our local coaching response instead
          aiResponse = generateEnhancedBuiltInResponse(
            currentInput,
            taskSummary
          );
        } else {
          // AI returned a text response
          aiResponse = data.data.message;

          // QUALITY CHECK: For upcoming_summary, verify OpenAI used actual task data
          if (intent === "upcoming_summary") {
            const hasActualTaskTitles =
              taskSummary.upcomingTasks &&
              taskSummary.upcomingTasks.length > 0 &&
              taskSummary.upcomingTasks.some((task) =>
                aiResponse.includes(task.title)
              );

            const hasSpecificDates =
              aiResponse.includes("Tomorrow") ||
              aiResponse.includes("Monday") ||
              aiResponse.includes("Tuesday") ||
              aiResponse.includes("Wednesday") ||
              aiResponse.includes("Thursday") ||
              aiResponse.includes("Friday") ||
              aiResponse.includes("Saturday") ||
              aiResponse.includes("Sunday") ||
              /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(
                aiResponse
              );

            const isGenericResponse =
              aiResponse.includes(
                "Review your high and urgent priority tasks"
              ) ||
              aiResponse.includes("Make sure to check and organize") ||
              aiResponse.includes("Aim to make daily progress") ||
              aiResponse.includes("Consider categorizing tasks");

            // If we have upcoming tasks but OpenAI didn't mention specific tasks or dates, or gave generic advice
            if (
              (taskSummary.upcomingTasks?.length || 0) > 0 &&
              ((!hasActualTaskTitles && !hasSpecificDates) || isGenericResponse)
            ) {
              console.warn(
                "🚫 OpenAI gave generic upcoming response despite having specific task data, using built-in response"
              );
              console.log(
                "📊 Upcoming tasks available:",
                taskSummary.upcomingTasks?.map((t) => t.title)
              );
              aiResponse = generateEnhancedBuiltInResponse(
                currentInput,
                taskSummary
              );
            }
          }
        }
      } else {
        // Fallback to enhanced built-in responses if the response format is unexpected
        console.warn("Unexpected API response format, using fallback.");
        aiResponse = generateEnhancedBuiltInResponse(currentInput, taskSummary);
      }

      // Add AI response
      const aiMessage: Message = {
        id: uuidv4(),
        content: aiResponse,
        sender: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Fallback to enhanced built-in responses on any error
      const intent = determineIntent(currentInput);
      const taskSummary = generateTaskSummary(intent);
      const fallbackResponse = generateEnhancedBuiltInResponse(
        currentInput,
        taskSummary
      );

      const aiMessage: Message = {
        id: uuidv4(),
        content: fallbackResponse,
        sender: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick action buttons
  const quickActions = [
    {
      icon: Calendar,
      label: "Upcoming",
      action: "What's coming up?",
    },
    {
      icon: Target,
      label: "Prioritize",
      action: "What should I prioritize?",
    },
    {
      icon: TrendingUp,
      label: "Today",
      action: "What did I accomplish today?",
    },
    {
      icon: Flame,
      label: "Streak",
      action: "How's my streak?",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white dark:bg-gray-900 border-l border-gray-200/50 dark:border-gray-700/50">
        <SheetHeader className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <SheetTitle className="text-lg font-semibold">
              AI Productivity Coach
            </SheetTitle>
            <SheetDescription className="text-xs text-gray-600 dark:text-gray-400">
              Personalized insights & task management ✨
            </SheetDescription>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <AIMessage
                key={message.id}
                message={message.content}
                isUser={message.sender === "user"}
              />
            ))}

            {isTyping && (
              <div className="flex gap-3 items-start animate-slide-fade">
                <div className="h-8 w-8 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 max-w-[80%]">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInput(action.action);
                  setTimeout(handleSendMessage, 100);
                }}
                className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <SheetFooter className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex w-full items-center space-x-3">
            <Input
              placeholder="Ask about your productivity..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
