"use client";

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useTodoStore } from '@/lib/store';

export default function Home() {
  const { fetchTasks } = useTodoStore();
  
  // Fetch tasks when the app loads
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return <MainLayout />;
}