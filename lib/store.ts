"use client";

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Task, Category, Tag, AIInsight } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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
  
  // Task actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  clearTasks: () => Promise<void>;
  reorderTasks: (taskIds: string[], startIndex: number, endIndex: number) => Promise<void>;
  
  // Category actions
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Tag actions
  addTag: (tag: Omit<Tag, 'id'>) => void;
  deleteTag: (id: string) => void;
  
  // AI related actions
  addInsight: (insight: Omit<AIInsight, 'id' | 'timestamp'>) => void;
  generateSuggestions: () => void;
  
  // Filter actions
  setFilter: (filter: Partial<TodoState['filterBy']>) => void;
  clearFilters: () => void;
}

// Helper function to convert Supabase row to Task
const supabaseRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  completed: row.completed,
  createdAt: row.created_at,
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
const taskToSupabaseFormat = (task: Partial<Task>) => ({
  id: task.id,
  title: task.title,
  description: task.description || null,
  completed: task.completed,
  created_at: task.createdAt,
  due_date: task.dueDate || null,
  priority: task.priority,
  category: task.category || null,
  tags: task.tags || null,
  ai_generated: task.aiGenerated || null,
  ai_suggestions: task.aiSuggestions || null,
  parent_id: task.parentId || null,
  sort_order: task.sortOrder || 0,
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
const categoryToSupabaseFormat = (category: Partial<Category>) => ({
  id: category.id,
  name: category.name,
  color: category.color,
  icon: category.icon,
  created_at: category.createdAt,
  user_id: category.userId || '00000000-0000-0000-0000-000000000000',
});

export const useTodoStore = create<TodoState>()((set, get) => ({
  tasks: [],
  categories: [],
  tags: [
    { id: uuidv4(), name: 'Important' },
    { id: uuidv4(), name: 'Urgent' },
    { id: uuidv4(), name: 'Later' },
  ],
  insights: [],
  isLoading: false,
  filterBy: {
    category: null,
    priority: null,
    completed: null,
    search: '',
  },
  
  fetchTasks: async () => {
    if (!supabase) {
      console.warn('Supabase not configured, using local storage fallback');
      // Try to load from localStorage as fallback
      try {
        const stored = localStorage.getItem('todo-tasks');
        if (stored) {
          const tasks = JSON.parse(stored);
          set({ tasks, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        set({ isLoading: false });
      }
      return;
    }

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }
      
      const tasks = data?.map(supabaseRowToTask) || [];
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    if (!supabase) {
      console.warn('Supabase not configured, using default categories');
      // Use default categories as fallback
      const defaultCategories: Category[] = [
        { id: uuidv4(), name: 'Work', color: '#818cf8', icon: 'briefcase' },
        { id: uuidv4(), name: 'Personal', color: '#22d3ee', icon: 'user' },
        { id: uuidv4(), name: 'Health', color: '#22c55e', icon: 'heart' },
        { id: uuidv4(), name: 'Finance', color: '#eab308', icon: 'dollar-sign' },
        { id: uuidv4(), name: 'Education', color: '#ec4899', icon: 'book-open' },
      ];
      set({ categories: defaultCategories });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      const categories = data?.map(supabaseRowToCategory) || [];
      set({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },
  
  addTask: async (task) => {
    const currentTasks = get().tasks;
    const maxSortOrder = Math.max(...currentTasks.map(t => t.sortOrder || 0), 0);
    
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      sortOrder: maxSortOrder + 1,
    };

    // If it's a subtask, inherit category from parent
    if (task.parentId) {
      const parentTask = get().tasks.find(t => t.id === task.parentId);
      if (parentTask && parentTask.category) {
        newTask.category = parentTask.category;
      }
    }
    
    if (!supabase) {
      // Fallback to localStorage
      const updatedTasks = [newTask, ...currentTasks];
      set({ tasks: updatedTasks });
      try {
        localStorage.setItem('todo-tasks', JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([taskToSupabaseFormat(newTask)]);
      
      if (error) {
        console.error('Error adding task:', error);
        return;
      }
      
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));
    } catch (error) {
      console.error('Error adding task:', error);
    }
  },
  
  updateTask: async (id, updates) => {
    if (!supabase) {
      // Fallback to localStorage
      const currentTasks = get().tasks;
      const updatedTasks = currentTasks.map((task) => 
        task.id === id ? { ...task, ...updates } : task
      );
      set({ tasks: updatedTasks });
      try {
        localStorage.setItem('todo-tasks', JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update(taskToSupabaseFormat(updates))
        .eq('id', id);
      
      if (error) {
        console.error('Error updating task:', error);
        return;
      }
      
      set((state) => ({
        tasks: state.tasks.map((task) => 
          task.id === id ? { ...task, ...updates } : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  },
  
  deleteTask: async (id) => {
    if (!supabase) {
      // Fallback to localStorage
      const currentTasks = get().tasks;
      const updatedTasks = currentTasks.filter((task) => task.id !== id && task.parentId !== id);
      set({ tasks: updatedTasks });
      try {
        localStorage.setItem('todo-tasks', JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }

    try {
      // First, delete all subtasks
      const subtasks = get().tasks.filter(task => task.parentId === id);
      if (subtasks.length > 0) {
        const { error: subtaskError } = await supabase
          .from('tasks')
          .delete()
          .in('id', subtasks.map(t => t.id));
        
        if (subtaskError) {
          console.error('Error deleting subtasks:', subtaskError);
          return;
        }
      }
      
      // Then delete the main task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting task:', error);
        return;
      }
      
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id && task.parentId !== id),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },
  
  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    const updates = { completed: !task.completed };
    
    if (!supabase) {
      // Fallback to localStorage
      const currentTasks = get().tasks;
      let updatedTasks;
      
      if (!task.completed) {
        const subtasks = currentTasks.filter(t => t.parentId === id);
        updatedTasks = currentTasks.map((t) =>
          t.parentId === id ? { ...t, completed: true } : 
          t.id === id ? { ...t, ...updates } : t
        );
      } else {
        updatedTasks = currentTasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
      }
      
      set({ tasks: updatedTasks });
      try {
        localStorage.setItem('todo-tasks', JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }
    
    try {
      // Update the main task
      const { error } = await supabase
        .from('tasks')
        .update(taskToSupabaseFormat(updates))
        .eq('id', id);
      
      if (error) {
        console.error('Error toggling task completion:', error);
        return;
      }
      
      // If completing a parent task, complete all subtasks
      if (!task.completed) {
        const subtasks = get().tasks.filter(t => t.parentId === id);
        if (subtasks.length > 0) {
          const { error: subtaskError } = await supabase
            .from('tasks')
            .update({ completed: true })
            .in('id', subtasks.map(t => t.id));
          
          if (subtaskError) {
            console.error('Error completing subtasks:', subtaskError);
            return;
          }
          
          // Update subtasks in state
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.parentId === id ? { ...t, completed: true } : 
              t.id === id ? { ...t, ...updates } : t
            ),
          }));
        } else {
          // No subtasks, just update the main task
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }));
        }
      } else {
        // Just update the main task
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  },
  
  clearTasks: async () => {
    if (!supabase) {
      // Fallback to localStorage
      set({
        tasks: [],
        filterBy: {
          category: null,
          priority: null,
          completed: null,
          search: '',
        },
      });
      try {
        localStorage.removeItem('todo-tasks');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all tasks
      
      if (error) {
        console.error('Error clearing tasks:', error);
        return;
      }
      
      set({
        tasks: [],
        filterBy: {
          category: null,
          priority: null,
          completed: null,
          search: '',
        },
      });
    } catch (error) {
      console.error('Error clearing tasks:', error);
    }
  },

  reorderTasks: async (taskIds, startIndex, endIndex) => {
    const currentTasks = get().tasks;
    
    // Create a new array with the reordered tasks
    const reorderedTasks = [...currentTasks];
    const [movedTask] = reorderedTasks.splice(startIndex, 1);
    reorderedTasks.splice(endIndex, 0, movedTask);
    
    // Update sort orders
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      sortOrder: index,
    }));
    
    // Update state immediately for responsive UI
    set({ tasks: updatedTasks });
    
    if (!supabase) {
      // Fallback to localStorage
      try {
        localStorage.setItem('todo-tasks', JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }
    
    try {
      // Batch update sort orders in database
      const updates = updatedTasks.map(task => ({
        id: task.id,
        sort_order: task.sortOrder,
      }));
      
      // Use upsert to update sort orders
      const { error } = await supabase
        .from('tasks')
        .upsert(updates, { onConflict: 'id' });
      
      if (error) {
        console.error('Error updating task order:', error);
        // Revert state on error
        set({ tasks: currentTasks });
        return;
      }
    } catch (error) {
      console.error('Error updating task order:', error);
      // Revert state on error
      set({ tasks: currentTasks });
    }
  },
  
  addCategory: async (category) => {
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      // Ensure default values are set
      color: category.color || '#6b7280',
      icon: category.icon || 'folder',
    };

    if (!supabase) {
      // Fallback to in-memory storage
      set((state) => ({
        categories: [...state.categories, newCategory],
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_categories')
        .insert([categoryToSupabaseFormat(newCategory)]);
      
      if (error) {
        console.error('Error adding category:', error);
        return;
      }
      
      set((state) => ({
        categories: [...state.categories, newCategory],
      }));
    } catch (error) {
      console.error('Error adding category:', error);
    }
  },
  
  updateCategory: async (id, updates) => {
    if (!supabase) {
      // Fallback to in-memory storage
      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, ...updates } : category
        ),
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_categories')
        .update(categoryToSupabaseFormat(updates))
        .eq('id', id);
      
      if (error) {
        console.error('Error updating category:', error);
        return;
      }
      
      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, ...updates } : category
        ),
      }));
    } catch (error) {
      console.error('Error updating category:', error);
    }
  },
  
  deleteCategory: async (id) => {
    const categoryToDelete = get().categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    if (!supabase) {
      // Fallback to in-memory storage
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        tasks: state.tasks.map((task) =>
          task.category === categoryToDelete.name ? { ...task, category: undefined } : task
        ),
      }));
      return;
    }

    try {
      // First, update all tasks that use this category to have no category
      const tasksWithCategory = get().tasks.filter(task => task.category === categoryToDelete.name);
      if (tasksWithCategory.length > 0) {
        const { error: taskUpdateError } = await supabase
          .from('tasks')
          .update({ category: null })
          .in('id', tasksWithCategory.map(t => t.id));
        
        if (taskUpdateError) {
          console.error('Error updating tasks when deleting category:', taskUpdateError);
          return;
        }
      }

      // Then delete the category
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting category:', error);
        return;
      }
      
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        tasks: state.tasks.map((task) =>
          task.category === categoryToDelete.name ? { ...task, category: undefined } : task
        ),
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  },
  
  addTag: (tag) => set((state) => ({
    tags: [...state.tags, { ...tag, id: uuidv4() }],
  })),
  
  deleteTag: (id) => set((state) => ({
    tags: state.tags.filter((tag) => tag.id !== id),
  })),
  
  addInsight: (insight) => set((state) => ({
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
    
    // Fetch latest tasks to ensure we have current data
    await state.fetchTasks();
    
    const completedTasks = state.tasks.filter(task => task.completed);
    
    // A simple "AI" function that suggests tasks based on patterns
    if (completedTasks.length > 0) {
      // Generate a sample insight based on completed tasks
      const mostCommonCategory = getMostCommonValue(completedTasks.map(t => t.category));
      
      if (mostCommonCategory) {
        state.addInsight({
          type: 'suggestion',
          content: `You've been productive with ${mostCommonCategory} tasks lately. Would you like to create more tasks in this category?`,
          relatedTasks: completedTasks
            .filter(t => t.category === mostCommonCategory)
            .map(t => t.id),
        });
      }
      
      // Generate a sample task suggestion
      if (completedTasks.length >= 3) {
        const randomCompletedTask = completedTasks[Math.floor(Math.random() * completedTasks.length)];
        const suggestedTitle = `Follow up on: ${randomCompletedTask.title}`;
        
        await state.addTask({
          title: suggestedTitle,
          description: 'AI suggested follow-up task',
          completed: false,
          priority: randomCompletedTask.priority,
          category: randomCompletedTask.category,
          tags: randomCompletedTask.tags,
          aiGenerated: true,
          aiSuggestions: [
            'Consider scheduling this as a recurring task',
            'This might pair well with other similar tasks',
          ],
        });
      }
    }
  },
  
  setFilter: (filter) => set((state) => ({
    filterBy: { ...state.filterBy, ...filter },
  })),
  
  clearFilters: () => set({
    filterBy: {
      category: null,
      priority: null,
      completed: null,
      search: '',
    },
  }),
}));

// Helper function to get the most common value in an array
function getMostCommonValue<T>(arr: (T | undefined)[]): T | undefined {
  const filtered = arr.filter(Boolean) as T[];
  if (filtered.length === 0) return undefined;
  
  const counts = filtered.reduce((acc, val) => {
    acc[String(val)] = (acc[String(val)] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as unknown as T;
}