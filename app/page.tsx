"use client";

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useTodoStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { format } from 'date-fns';

export default function Home() {
  const { tasks, addTask, _hasHydrated } = useTodoStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Wait for hydration and then initialize sample tasks if needed
  useEffect(() => {
    if (!_hasHydrated) return;
    
    // Only add sample tasks if the store is hydrated AND there are no existing tasks
    if (tasks.length === 0 && !isInitialized) {
      const sampleTasks: Omit<Task, 'id' | 'createdAt'>[] = [
        {
          title: 'Create project plan',
          description: 'Outline the project scope, timeline, and deliverables',
          completed: false,
          dueDate: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'high',
          category: 'Work',
          tags: ['Important'],
        },
        {
          title: 'Schedule doctor appointment',
          description: 'Annual checkup',
          completed: false,
          dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'medium',
          category: 'Health',
        },
        {
          title: 'Buy groceries',
          description: 'Get milk, eggs, bread, and vegetables',
          completed: true,
          dueDate: format(new Date(), 'yyyy-MM-dd'),
          priority: 'low',
          category: 'Personal',
        },
        {
          title: 'Review monthly budget',
          description: 'Check spending and adjust budget for next month',
          completed: false,
          dueDate: format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'medium',
          category: 'Finance',
        },
        {
          title: 'Complete online course',
          description: 'Finish final two modules of the AI course',
          completed: false,
          dueDate: format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'medium',
          category: 'Education',
          tags: ['Later'],
        },
      ];

      sampleTasks.forEach(task => {
        addTask(task);
      });
      
      setIsInitialized(true);
    }
  }, [_hasHydrated, tasks.length, addTask, isInitialized]);

  // Show loading state until the store is hydrated
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}