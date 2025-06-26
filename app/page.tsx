"use client";

import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MainLayout } from '@/components/layout/main-layout';
import { useTodoStore } from '@/lib/store';

export default function Home() {
  const { fetchTasks, fetchCategories } = useTodoStore();
  
  // Fetch tasks and categories when the app loads
  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks, fetchCategories]);

  return (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  );
}