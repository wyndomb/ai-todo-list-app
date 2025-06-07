"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/theme-toggle';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Bell, 
  User,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTodoStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AddTaskDialog } from '@/components/tasks/add-task-dialog';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const { setFilter, generateSuggestions } = useTodoStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilter({ search: query });
  };

  const handleGenerateInsights = () => {
    generateSuggestions();
    toast({
      title: "✨ AI Insights Generated",
      description: "New task suggestions and insights have been created based on your activity.",
      duration: 3000,
    });
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-10 w-full bg-gray-50/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:bg-white dark:focus:bg-gray-900 transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost" 
            className="relative rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></span>
          </Button>
          
          <Button 
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setShowAddTask(true)}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <DropdownMenuItem onClick={handleGenerateInsights} className="rounded-lg">
                <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                Generate AI Insights
              </DropdownMenuItem>
              <ModeToggle />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AddTaskDialog open={showAddTask} onOpenChange={setShowAddTask} />
    </header>
  );
}