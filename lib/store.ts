"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Task, Category, Tag, AIInsight } from '@/lib/types';

interface TodoState {
  tasks: Task[];
  categories: Category[];
  tags: Tag[];
  insights: AIInsight[];
  filterBy: {
    category: string | null;
    priority: string | null;
    completed: boolean | null;
    search: string;
  };
  
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  clearTasks: () => void;
  
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

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
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
      filterBy: {
        category: null,
        priority: null,
        completed: null,
        search: '',
      },
      
      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },
      
      addTask: (task) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            ...task,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          },
        ],
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) => 
          task.id === id ? { ...task, ...updates } : task
        ),
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      })),
      
      toggleTaskCompletion: (id) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        ),
      })),
      
      clearTasks: () => set({
        tasks: [],
        // Also clear all filters when clearing tasks
        filterBy: {
          category: null,
          priority: null,
          completed: null,
          search: '',
        },
      }),
      
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
      
      generateSuggestions: () => {
        const state = get();
        const completedTasks = state.tasks.filter(task => task.completed);
        
        // A simple "AI" function that suggests tasks based on patterns
        // In a real app, this would connect to an actual AI service
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
            
            state.addTask({
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
    }),
    {
      name: 'ai-todo-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

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