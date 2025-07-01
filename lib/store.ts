"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { Task, Category, Tag, AIInsight } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface TodoState {
  tasks: Task[];
  categories: Category[];
  tags: Tag[];
  insights: AIInsight[];
  isLoading: boolean;
  filterBy: {
    category: string | null;
    priority: string | null;
    completed: boolean | null;
    search: string;
  };
  viewDate: Date | null;

  // Task actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, "id">>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  clearTasks: () => Promise<void>;
  reorderTasks: (
    taskIds: string[],
    startIndex: number,
    endIndex: number
  ) => Promise<void>;

  // Category actions
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, "id" | "createdAt">) => Promise<void>;
  updateCategory: (
    id: string,
    updates: Partial<Omit<Category, "id">>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Tag actions
  addTag: (tag: Omit<Tag, "id">) => void;
  deleteTag: (id: string) => void;

  // AI related actions
  addInsight: (insight: Omit<AIInsight, "id" | "timestamp">) => void;
  generateSuggestions: () => void;

  // Filter actions
  setFilter: (filter: Partial<TodoState["filterBy"]>) => void;
  clearFilters: () => void;

  // ViewDate actions
  setViewDate: (date: Date | null) => void;
}

// Helper function to get current user ID
const getCurrentUserId = async () => {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper function to convert Supabase row to Task
const supabaseRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  completed: row.completed,
  createdAt: row.created_at,
  completedAt: row.completed_at || undefined,
  dueDate: row.due_date || undefined,
  priority: row.priority,
  category: row.category || undefined,
  tags: row.tags || undefined,
  aiGenerated: row.ai_generated || undefined,
  aiSuggestions: row.ai_suggestions || undefined,
  parentId: row.parent_id || undefined,
  sortOrder: row.sort_order || 0,
});

// Helper function to convert Task to Supabase insert/update format
const taskToSupabaseFormat = (task: Partial<Task>, userId?: string) => ({
  id: task.id,
  title: task.title,
  description: task.description || null,
  completed: task.completed,
  created_at: task.createdAt,
  completed_at: task.completedAt || null,
  due_date: task.dueDate || null,
  priority: task.priority,
  category: task.category || null,
  tags: task.tags || null,
  ai_generated: task.aiGenerated || null,
  ai_suggestions: task.aiSuggestions || null,
  parent_id: task.parentId || null,
  sort_order: task.sortOrder || 0,
  user_id: userId,
});

// Helper function to convert Supabase row to Category
const supabaseRowToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
  icon: row.icon,
  createdAt: row.created_at,
  userId: row.user_id,
});

// Helper function to convert Category to Supabase insert/update format
const categoryToSupabaseFormat = (
  category: Partial<Category>,
  userId?: string
) => ({
  id: category.id,
  name: category.name,
  color: category.color,
  icon: category.icon,
  created_at: category.createdAt,
  user_id: userId,
});

export const useTodoStore = create<TodoState>()((set, get) => ({
  tasks: [],
  categories: [],
  tags: [
    { id: uuidv4(), name: "Important" },
    { id: uuidv4(), name: "Urgent" },
    { id: uuidv4(), name: "Later" },
  ],
  insights: [],
  isLoading: false,
  filterBy: {
    category: null,
    priority: null,
    completed: null,
    search: "",
  },
  viewDate: null,

  fetchTasks: async () => {
    if (!supabase) {
      console.warn("Supabase not configured, using local storage fallback");
      try {
        const stored = localStorage.getItem("todo-tasks");
        if (stored) {
          const tasks = JSON.parse(stored);
          set({ tasks, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        set({ isLoading: false });
      }
      return;
    }

    set({ isLoading: true });
    try {
      const userId = await getCurrentUserId();

      // Try to fetch tasks with user_id first (if authenticated)
      let query = supabase.from("tasks").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);

        // If there's an error (like missing user_id column), try fallback without user filtering
        if (error.message.includes("user_id") || error.code === "42703") {
          console.warn("Attempting fallback query without user_id filter...");
          try {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("tasks")
              .select("*")
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: false });

            if (fallbackError) {
              console.error("Fallback query also failed:", fallbackError);
              // Use localStorage as final fallback
              const stored = localStorage.getItem("todo-tasks");
              if (stored) {
                const tasks = JSON.parse(stored);
                set({ tasks, isLoading: false });
              } else {
                set({ tasks: [], isLoading: false });
              }
              return;
            }

            const tasks = fallbackData?.map(supabaseRowToTask) || [];
            set({ tasks, isLoading: false });
            return;
          } catch (fallbackError) {
            console.error("Fallback query failed:", fallbackError);
            set({ tasks: [], isLoading: false });
            return;
          }
        }

        set({ tasks: [], isLoading: false });
        return;
      }

      const tasks = data?.map(supabaseRowToTask) || [];
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // Use localStorage as final fallback
      try {
        const stored = localStorage.getItem("todo-tasks");
        if (stored) {
          const tasks = JSON.parse(stored);
          set({ tasks, isLoading: false });
        } else {
          set({ tasks: [], isLoading: false });
        }
      } catch (storageError) {
        console.error("Error loading from localStorage:", storageError);
        set({ tasks: [], isLoading: false });
      }
    }
  },

  fetchCategories: async () => {
    if (!supabase) {
      console.warn("Supabase not configured, using default categories");
      const defaultCategories: Category[] = [
        {
          id: uuidv4(),
          name: "Work",
          color: "#818cf8",
          icon: "briefcase",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Personal",
          color: "#22d3ee",
          icon: "user",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Health",
          color: "#22c55e",
          icon: "heart",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Finance",
          color: "#eab308",
          icon: "dollar-sign",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Education",
          color: "#ec4899",
          icon: "book-open",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
      ];
      set({ categories: defaultCategories });
      return;
    }

    try {
      const userId = await getCurrentUserId();

      // Try to fetch categories with user_id first (if authenticated)
      let query = supabase.from("user_categories").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: true,
      });

      if (error) {
        console.error("Error fetching categories:", error);

        // If there's an error (like missing user_id column or RLS), use default categories
        if (
          error.message.includes("user_id") ||
          error.code === "42703" ||
          error.code === "42501"
        ) {
          console.warn(
            "Using default categories due to database access issues"
          );
          const defaultCategories: Category[] = [
            {
              id: uuidv4(),
              name: "Work",
              color: "#818cf8",
              icon: "briefcase",
              createdAt: new Date().toISOString(),
              userId: "default",
            },
            {
              id: uuidv4(),
              name: "Personal",
              color: "#22d3ee",
              icon: "user",
              createdAt: new Date().toISOString(),
              userId: "default",
            },
            {
              id: uuidv4(),
              name: "Health",
              color: "#22c55e",
              icon: "heart",
              createdAt: new Date().toISOString(),
              userId: "default",
            },
            {
              id: uuidv4(),
              name: "Finance",
              color: "#eab308",
              icon: "dollar-sign",
              createdAt: new Date().toISOString(),
              userId: "default",
            },
            {
              id: uuidv4(),
              name: "Education",
              color: "#ec4899",
              icon: "book-open",
              createdAt: new Date().toISOString(),
              userId: "default",
            },
          ];
          set({ categories: defaultCategories });
          return;
        }
        return;
      }

      const categories = data?.map(supabaseRowToCategory) || [];

      // If no categories found, provide default ones
      if (categories.length === 0) {
        const defaultCategories: Category[] = [
          {
            id: uuidv4(),
            name: "Work",
            color: "#818cf8",
            icon: "briefcase",
            createdAt: new Date().toISOString(),
            userId: userId || "default",
          },
          {
            id: uuidv4(),
            name: "Personal",
            color: "#22d3ee",
            icon: "user",
            createdAt: new Date().toISOString(),
            userId: userId || "default",
          },
          {
            id: uuidv4(),
            name: "Health",
            color: "#22c55e",
            icon: "heart",
            createdAt: new Date().toISOString(),
            userId: userId || "default",
          },
          {
            id: uuidv4(),
            name: "Finance",
            color: "#eab308",
            icon: "dollar-sign",
            createdAt: new Date().toISOString(),
            userId: userId || "default",
          },
          {
            id: uuidv4(),
            name: "Education",
            color: "#ec4899",
            icon: "book-open",
            createdAt: new Date().toISOString(),
            userId: userId || "default",
          },
        ];
        set({ categories: defaultCategories });
        return;
      }

      set({ categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Use default categories as final fallback
      const defaultCategories: Category[] = [
        {
          id: uuidv4(),
          name: "Work",
          color: "#818cf8",
          icon: "briefcase",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Personal",
          color: "#22d3ee",
          icon: "user",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Health",
          color: "#22c55e",
          icon: "heart",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Finance",
          color: "#eab308",
          icon: "dollar-sign",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
        {
          id: uuidv4(),
          name: "Education",
          color: "#ec4899",
          icon: "book-open",
          createdAt: new Date().toISOString(),
          userId: "default",
        },
      ];
      set({ categories: defaultCategories });
    }
  },

  addTask: async (task) => {
    const currentTasks = get().tasks;
    const maxSortOrder = Math.max(
      ...currentTasks.map((t) => t.sortOrder || 0),
      0
    );

    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      sortOrder: maxSortOrder + 1,
    };

    if (task.parentId) {
      const parentTask = get().tasks.find((t) => t.id === task.parentId);
      if (parentTask && parentTask.category) {
        newTask.category = parentTask.category;
      }
    }

    // Optimistic update
    set((state) => ({ tasks: [newTask, ...state.tasks] }));

    if (!supabase) {
      try {
        localStorage.setItem("todo-tasks", JSON.stringify(get().tasks));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot save to database");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .insert(taskToSupabaseFormat(newTask, userId));

      if (error) {
        console.error("Error adding task:", error);
        // Revert optimistic update
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== newTask.id),
        }));
      }
    } catch (error) {
      console.error("Error adding task:", error);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== newTask.id),
      }));
    }
  },

  updateTask: async (id, updates) => {
    const originalTasks = get().tasks;
    const task = originalTasks.find((t) => t.id === id);
    if (!task) return;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    if (!supabase) {
      try {
        localStorage.setItem("todo-tasks", JSON.stringify(get().tasks));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot save to database");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update(taskToSupabaseFormat(updates, userId))
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating task:", error);
        // Revert optimistic update
        set({ tasks: originalTasks });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      set({ tasks: originalTasks });
    }
  },

  deleteTask: async (id) => {
    const originalTasks = get().tasks;
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    if (!supabase) {
      try {
        localStorage.setItem("todo-tasks", JSON.stringify(get().tasks));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot save to database");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting task:", error);
        // Revert optimistic update
        set({ tasks: originalTasks });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      set({ tasks: originalTasks });
    }
  },

  toggleTaskCompletion: async (id) => {
    const originalTasks = get().tasks;
    const task = originalTasks.find((t) => t.id === id);
    if (!task) return;

    const now = new Date().toISOString();
    const updates = {
      completed: !task.completed,
      completedAt: !task.completed ? now : undefined,
    };

    // Optimistically update UI first
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    if (!supabase) {
      const currentTasks = get().tasks;
      let updatedTasks;

      if (!task.completed) {
        const subtasks = currentTasks.filter((t) => t.parentId === id);
        updatedTasks = currentTasks.map((t) =>
          t.parentId === id
            ? { ...t, completed: true, completedAt: now }
            : t.id === id
            ? { ...t, ...updates }
            : t
        );
      } else {
        updatedTasks = currentTasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
      }

      set({ tasks: updatedTasks });
      try {
        localStorage.setItem("todo-tasks", JSON.stringify(updatedTasks));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot save to database");
        return;
      }

      // Explicitly define the update object for Supabase
      const supabaseUpdate = {
        completed: updates.completed,
        completed_at: updates.completedAt || null,
      };

      const { error } = await supabase
        .from("tasks")
        .update(supabaseUpdate)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error toggling task completion:", error);
        // Revert optimistic update on error
        set({ tasks: originalTasks });
        return;
      }

      // If completing a parent task, also complete its subtasks
      if (!task.completed) {
        const subtasks = get().tasks.filter((t) => t.parentId === id);
        if (subtasks.length > 0) {
          const { error: subtaskError } = await supabase
            .from("tasks")
            .update({ completed: true, completed_at: now })
            .in(
              "id",
              subtasks.map((t) => t.id)
            )
            .eq("user_id", userId);

          if (subtaskError) {
            console.error("Error completing subtasks:", subtaskError);
            return;
          }

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.parentId === id
                ? { ...t, completed: true, completedAt: now }
                : t.id === id
                ? { ...t, ...updates } // Ensure parent is also updated in local state
                : t
            ),
          }));
        }
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      // Revert optimistic update on error
      set({ tasks: originalTasks });
    }
  },

  clearTasks: async () => {
    if (!supabase) {
      set({
        tasks: [],
        filterBy: {
          category: null,
          priority: null,
          completed: null,
          search: "",
        },
      });
      try {
        localStorage.removeItem("todo-tasks");
      } catch (error) {
        console.error("Error clearing localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error clearing tasks:", error);
        return;
      }

      set({
        tasks: [],
        filterBy: {
          category: null,
          priority: null,
          completed: null,
          search: "",
        },
      });
    } catch (error) {
      console.error("Error clearing tasks:", error);
    }
  },

  reorderTasks: async (taskIds, startIndex, endIndex) => {
    const originalTasks = get().tasks;
    const reorderedTasks = arrayMove(originalTasks, startIndex, endIndex);

    // Optimistic update with new sort orders
    const updatedTasks = reorderedTasks.map((task: Task, index: number) => ({
      ...task,
      sortOrder: index,
    }));
    set({ tasks: updatedTasks });

    if (!supabase) {
      try {
        localStorage.setItem("todo-tasks", JSON.stringify(updatedTasks));
      } catch (error) {
        console.error("Error saving reordered tasks to localStorage:", error);
        set({ tasks: originalTasks }); // Revert
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID, cannot save reordered tasks");
        return;
      }
      // Batch update the sort order in Supabase
      const updates = updatedTasks.map((task: Task) => ({
        id: task.id,
        sort_order: task.sortOrder,
        user_id: userId,
      }));

      const { error } = await supabase.from("tasks").upsert(updates);

      if (error) {
        console.error("Error saving reordered tasks:", error);
        set({ tasks: originalTasks }); // Revert on error
      }
    } catch (error) {
      console.error("Error reordering tasks:", error);
      set({ tasks: originalTasks });
    }
  },

  addCategory: async (category) => {
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      color: category.color || "#6b7280",
      icon: category.icon || "folder",
    };

    set((state) => ({ categories: [...state.categories, newCategory] }));

    if (!supabase) {
      try {
        localStorage.setItem(
          "todo-categories",
          JSON.stringify(get().categories)
        );
      } catch (error) {
        console.error("Error saving category to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot save category");
        return;
      }

      const { error } = await supabase
        .from("user_categories")
        .insert([categoryToSupabaseFormat(newCategory, userId)]);

      if (error) {
        console.error("Error adding category:", error);
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== newCategory.id),
        }));
      }
    } catch (error) {
      console.error("Error adding category:", error);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== newCategory.id),
      }));
    }
  },

  updateCategory: async (id, updates) => {
    const originalCategories = get().categories;
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));

    if (!supabase) {
      try {
        localStorage.setItem(
          "todo-categories",
          JSON.stringify(get().categories)
        );
      } catch (error) {
        console.error("Error saving category to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot update category");
        return;
      }

      const { error } = await supabase
        .from("user_categories")
        .update(categoryToSupabaseFormat(updates, userId))
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating category:", error);
        set({ categories: originalCategories });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      set({ categories: originalCategories });
    }
  },

  deleteCategory: async (id) => {
    const originalCategories = get().categories;
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));

    if (!supabase) {
      try {
        localStorage.setItem(
          "todo-categories",
          JSON.stringify(get().categories)
        );
      } catch (error) {
        console.error("Error saving category to localStorage:", error);
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found, cannot delete category");
        return;
      }

      const { error } = await supabase
        .from("user_categories")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting category:", error);
        set({ categories: originalCategories });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      set({ categories: originalCategories });
    }
  },

  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, { ...tag, id: uuidv4() }],
    })),

  deleteTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
    })),

  addInsight: (insight) =>
    set((state) => ({
      insights: [
        ...state.insights,
        {
          ...insight,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  generateSuggestions: async () => {
    const state = get();
    // Ensure tasks are fresh before generating suggestions
    await state.fetchTasks();

    const completedTasks = state.tasks.filter((task) => task.completed);
    if (completedTasks.length > 0) {
      // Suggest creating more tasks in the most common category
      const mostCommonCategory = getMostCommonValue(
        completedTasks.map((t) => t.category)
      );
      if (mostCommonCategory) {
        state.addInsight({
          type: "suggestion",
          content: `You've been productive with ${mostCommonCategory} tasks. Create another?`,
          relatedTasks: completedTasks
            .filter((t) => t.category === mostCommonCategory)
            .map((t) => t.id),
        });
      }

      // After completing 3+ tasks, suggest a follow-up for a random one
      if (completedTasks.length >= 3) {
        const randomCompletedTask =
          completedTasks[Math.floor(Math.random() * completedTasks.length)];
        const suggestedTitle = `Follow-up on: ${randomCompletedTask.title}`;

        await state.addTask({
          title: suggestedTitle,
          description: `AI-suggested follow-up for "${randomCompletedTask.title}"`,
          completed: false,
          priority: randomCompletedTask.priority,
          category: randomCompletedTask.category,
          tags: randomCompletedTask.tags,
          aiGenerated: true,
          aiSuggestions: [
            "Consider if this should be a recurring task.",
            "Break this down into smaller sub-tasks.",
          ],
        });
      }
    }
  },

  setFilter: (filter) =>
    set((state) => ({
      filterBy: { ...state.filterBy, ...filter },
    })),

  clearFilters: () =>
    set({
      filterBy: {
        category: null,
        priority: null,
        completed: null,
        search: "",
      },
    }),

  setViewDate: (date) => set({ viewDate: date }),
}));

function getMostCommonValue<T>(arr: (T | undefined)[]): T | undefined {
  const filtered = arr.filter(Boolean) as T[];
  if (filtered.length === 0) return undefined;

  const counts = filtered.reduce((acc, value) => {
    const key = String(value);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonKey = Object.keys(counts).reduce((a, b) =>
    counts[a] > counts[b] ? a : b
  );

  return filtered.find((item) => String(item) === mostCommonKey);
}
