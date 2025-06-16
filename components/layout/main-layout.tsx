"use client";

import { useState, useMemo } from 'react';
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
  ChevronDown
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
import { isToday } from 'date-fns';

export function MainLayout() {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<'today' | 'upcoming' | 'calendar' | 'insights'>('today');
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const { tasks, categories, filterBy, setFilter } = useTodoStore();

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
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 z-40 w-64 bg-gray-900 text-gray-100 shadow-xl">
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
                  onClick={() => setActiveView(item.id as typeof activeView)}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-6">
          <div className="animate-fade-in">
            {renderActiveView()}
          </div>
        </main>
        <Footer />
        <AIAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      </div>
    </div>
  );
}