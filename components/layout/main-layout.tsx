"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AIAssistantPanel } from '@/components/ai/ai-assistant-panel';
import { Dashboard } from '@/components/dashboard/dashboard';
import { InsightsDashboard } from '@/components/dashboard/insights-dashboard';
import { CalendarView } from '@/components/dashboard/calendar-view';
import { cn } from '@/lib/utils';
import { 
  Sun, 
  CalendarDays, 
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

export function MainLayout() {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [activeView, setActiveView] = useState<'today' | 'insights'>('today');

  const toggleAiPanel = () => setAiPanelOpen(!aiPanelOpen);

  const navigationItems = [
    { id: 'today', icon: Sun, label: 'Today', color: 'text-orange-500', onClick: () => setActiveView('today') },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar', color: 'text-green-500', onClick: () => setShowCalendarPanel(true) },
    { id: 'insights', icon: BarChart3, label: 'Insights', color: 'text-purple-500', onClick: () => setActiveView('insights') }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'insights':
        return <InsightsDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 z-40 w-16 bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="flex flex-col h-full py-4">
          <TooltipProvider>
            <div className="flex-1 flex flex-col items-center gap-3 pt-4">
              {navigationItems.map((item) => (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={item.onClick}
                      className={cn(
                        "p-3 rounded-xl transition-all duration-200 hover:scale-105 group",
                        (activeView === item.id || (item.id === 'calendar' && showCalendarPanel))
                          ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-md" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        (activeView === item.id || (item.id === 'calendar' && showCalendarPanel)) ? item.color : ""
                      )} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-xl">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 pt-4">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleAiPanel}
                    className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 text-purple-500 hover:text-purple-600 transition-all duration-200 hover:scale-105 group"
                  >
                    <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="rounded-xl">
                  <p>AI Assistant</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-16">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-6">
          <div className="animate-fade-in">
            {renderActiveView()}
          </div>
        </main>
        <Footer />
        <AIAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
        <CalendarView 
          open={showCalendarPanel} 
          onClose={() => setShowCalendarPanel(false)} 
        />
      </div>
    </div>
  );
}