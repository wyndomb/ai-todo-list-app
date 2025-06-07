"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTodoStore } from '@/lib/store';
import { 
  CheckSquare, 
  Calendar, 
  BarChart, 
  Tag, 
  Clock,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const { tasks, categories, setFilter, filterBy } = useTodoStore();
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [priorityOpen, setPriorityOpen] = useState(false);

  // Count tasks by category and priority
  const categoryTaskCount = categories.reduce((acc, category) => {
    acc[category.name] = tasks.filter(task => task.category === category.name).length;
    return acc;
  }, {} as Record<string, number>);

  const priorityTaskCount = {
    low: tasks.filter(task => task.priority === 'low').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    high: tasks.filter(task => task.priority === 'high').length,
    urgent: tasks.filter(task => task.priority === 'urgent').length,
  };

  const activeTasksCount = tasks.filter(task => !task.completed).length;
  const completedTasksCount = tasks.filter(task => task.completed).length;
  const todayTasksCount = tasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate === today && !task.completed;
  }).length;

  // Return appropriate icon for a category
  const getCategoryIcon = (name: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      Work: <briefcase className="w-4 h-4" />,
      Personal: <user className="w-4 h-4" />,
      Health: <heart className="w-4 h-4" />,
      Finance: <dollar-sign className="w-4 h-4" />,
      Education: <book-open className="w-4 h-4" />,
    };
    
    return iconMap[name] || <Tag className="w-4 h-4" />;
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out pt-16 md:relative md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary-foreground">UI</AvatarFallback>
            </Avatar>
            <div className="ml-2 flex flex-col">
              <p className="text-sm font-medium">User Interface</p>
              <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-1 py-2">
            <Button 
              variant={!filterBy.completed && !filterBy.category && !filterBy.priority ? "default" : "ghost"} 
              size="sm"
              className="w-full justify-start"
              onClick={() => setFilter({
                category: null,
                priority: null,
                completed: null,
                search: '',
              })}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              All Tasks
              <Badge className="ml-auto" variant="outline">{tasks.length}</Badge>
            </Button>
            
            <Button 
              variant={filterBy.completed === false ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setFilter({ completed: false })}
            >
              <Clock className="mr-2 h-4 w-4" />
              Active Tasks
              <Badge className="ml-auto" variant="outline">{activeTasksCount}</Badge>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setFilter({ 
                  completed: false,
                  search: `due:${today}`
                });
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Today
              <Badge className="ml-auto" variant="outline">{todayTasksCount}</Badge>
            </Button>
            
            <Button 
              variant={filterBy.completed === true ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setFilter({ completed: true })}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Completed
              <Badge className="ml-auto" variant="outline">{completedTasksCount}</Badge>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>

          <div className="py-2">
            <Collapsible
              open={categoryOpen}
              onOpenChange={setCategoryOpen}
              className="space-y-1"
            >
              <div className="flex items-center justify-between px-1 py-2">
                <h2 className="text-sm font-semibold">Categories</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                    <PlusCircle className="h-3.5 w-3.5" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      {categoryOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent className="space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={filterBy.category === category.name ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => setFilter({ category: category.name })}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    <Badge className="ml-auto" variant="outline">
                      {categoryTaskCount[category.name] || 0}
                    </Badge>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible
              open={priorityOpen}
              onOpenChange={setPriorityOpen}
              className="space-y-1"
            >
              <div className="flex items-center justify-between px-1 py-2">
                <h2 className="text-sm font-semibold">Priority</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                    {priorityOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-1">
                <Button
                  variant={filterBy.priority === 'low' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => setFilter({ priority: 'low' })}
                >
                  <div className="w-2 h-2 rounded-full mr-2 bg-priority-low" />
                  Low
                  <Badge className="ml-auto" variant="outline">{priorityTaskCount.low}</Badge>
                </Button>
                <Button
                  variant={filterBy.priority === 'medium' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => setFilter({ priority: 'medium' })}
                >
                  <div className="w-2 h-2 rounded-full mr-2 bg-priority-medium" />
                  Medium
                  <Badge className="ml-auto" variant="outline">{priorityTaskCount.medium}</Badge>
                </Button>
                <Button
                  variant={filterBy.priority === 'high' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => setFilter({ priority: 'high' })}
                >
                  <div className="w-2 h-2 rounded-full mr-2 bg-priority-high" />
                  High
                  <Badge className="ml-auto" variant="outline">{priorityTaskCount.high}</Badge>
                </Button>
                <Button
                  variant={filterBy.priority === 'urgent' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => setFilter({ priority: 'urgent' })}
                >
                  <div className="w-2 h-2 rounded-full mr-2 bg-priority-urgent" />
                  Urgent
                  <Badge className="ml-auto" variant="outline">{priorityTaskCount.urgent}</Badge>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </div>
    </div>
  );
}