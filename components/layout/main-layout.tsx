"use client";

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AIAssistantPanel } from '@/components/ai/ai-assistant-panel';
import { Dashboard } from '@/components/dashboard/dashboard';
import { CalendarView } from '@/components/dashboard/calendar-view';
import { UpcomingView } from '@/components/dashboard/upcoming-view';
import { InsightsDashboard } from '@/components/dashboard/insights-dashboard';
import { useTodoStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Search,
  Sun, 
  CalendarDays, 
  Calendar,
  BarChart3,
  Sparkles,
  Hash,
  ChevronDown,
  Menu,
  Loader2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MainLayout() {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<'today' | 'upcoming' | 'calendar' | 'insights'>('today');
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { tasks, categories, filterBy, setFilter, isLoading } = useTodoStore();

  const toggleAiPanel = () => setAiPanelOpen(!aiPanelOpen);

  // Calculate dynamic counts
  const todayTasksCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => 
      !task.completed && (
        task.dueDate === today || 
        (task.dueDate && task.dueDate < today)
      )
    ).length;
  }, [tasks]);

  const categoryTaskCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.name] = tasks.filter(task => 
        !task.completed && task.category === category.name
      ).length;
      return acc;
    }, {} as Record<string, number>);
  }, [tasks, categories]);

  const navigationItems = [
    { 
      id: 'today', 
      icon: Sun, 
      label: 'Today', 
      count: todayTasksCount,
      activeColor: 'bg-red-500/90 text-white hover:bg-red-600/90'
    },
    { 
      id: 'upcoming', 
      icon: Calendar, 
      label: 'Upcoming', 
      count: null,
      activeColor: 'bg-blue-500/90 text-white hover:bg-blue-600/90'
    },
    { 
      id: 'calendar', 
      icon: CalendarDays, 
      label: 'Calendar', 
      count: null,
      activeColor: 'bg-green-500/90 text-white hover:bg-green-600/90'
    },
    { 
      id: 'insights', 
      icon: BarChart3, 
      label: 'Insights', 
      count: null,
      activeColor: 'bg-purple-500/90 text-white hover:bg-purple-600/90'
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'calendar':
        return <CalendarView />;
      case 'insights':
        return <InsightsDashboard />;
      case 'upcoming':
        return <UpcomingView />;
      default:
        return <Dashboard />;
    }
  };

  const handleCategoryFilter = (categoryName: string | null) => {
    setFilter({ category: categoryName });
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

  const handleViewChange = (view: typeof activeView) => {
    setActiveView(view);
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

  // Show loading state while fetching initial data
  if (isLoading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Sidebar content component for reuse
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3 text-gray-300">
          <Search className="h-5 w-5" />
          <span className="text-sm font-medium">Search</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4">
        <div className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as typeof activeView)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeView === item.id 
                  ? item.activeColor
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {item.count !== null && item.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full font-medium",
                  activeView === item.id 
                    ? "bg-white/20 text-white" 
                    : "bg-gray-700 text-gray-300"
                )}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* My Projects Section */}
        <div className="mt-8 px-2">
          <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors">
              <span>My Projects</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                  {categories.length}/5
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isProjectsOpen && "rotate-180"
                )} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    filterBy.category === category.name
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Hash 
                      className="h-4 w-4" 
                      style={{ color: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                  {categoryTaskCounts[category.name] > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300 font-medium">
                      {categoryTaskCounts[category.name]}
                    </span>
                  )}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* AI Assistant Button */}
      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={toggleAiPanel}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-200"
        >
          <Sparkles className="h-5 w-5" />
          <span>AI Assistant</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 w-64 bg-gray-900 text-gray-100 shadow-xl">
        <SidebarContent />
      </div>

      {/* Mobile Menu Button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-md rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-gray-900 text-gray-100 border-gray-700">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header />
        <main className="flex-1 container mx-auto p-4 lg:p-6 max-w-none">
          <div className="animate-fade-in">
            {renderActiveView()}
          </div>
        </main>
        <Footer />
        <AIAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as typeof activeView)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative",
                activeView === item.id 
                  ? "text-primary" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.count !== null && item.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}