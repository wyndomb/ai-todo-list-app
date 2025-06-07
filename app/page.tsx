"use client";

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useTodoStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { format } from 'date-fns';

export default function Home() {
  const { tasks, addTask } = useTodoStore();
  
  // Add sample tasks if none exist
  useEffect(() => {
    if (tasks.length === 0) {
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
    }
  }, [tasks, addTask]);

  return <MainLayout />;
}