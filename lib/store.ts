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
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
  
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
});

export const useTodoStore = create<TodoState>()((set, get) => ({
  tasks: [],
  categories: [
    { id: uuidv4(), name: 'Work', color: '#818cf8', icon: 'briefcase' },
    { id: uuidv4(), name: 'Personal', color: '#22d3ee', icon: 'user' },
    { id: uuidv4(), name: 'Health', color: '#22c55e', icon: 'heart' },
    { id: uuidv4(), name: 'Finance', color: '#eab308', icon: 'dollar-sign' },
    { id: uuidv4(), name: 'Education', color: '#ec4899', icon: 'book-open' },
  ],
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
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
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
  
  addTask: async (task) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
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
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting task:', error);
        return;
      }
      
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },
  
  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    const updates = { completed: !task.completed };
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update(taskToSupabaseFormat(updates))
        .eq('id', id);
      
      if (error) {
        console.error('Error toggling task completion:', error);
        return;
      }
      
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      }));
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  },
  
  clearTasks: async () => {
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
  
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, { ...category, id: uuidv4() }],
  })),
  
  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map((category) =>
      category.id === id ? { ...category, ...updates } : category
    ),
  })),
  
  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter((category) => category.id !== id),
  })),
  
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