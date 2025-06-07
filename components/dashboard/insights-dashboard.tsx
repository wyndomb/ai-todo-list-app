"use client";

import { useMemo, useState } from 'react';
import { useTodoStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { BrainCircuit, TrendingUp, Activity, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, isToday } from 'date-fns';

export function InsightsDashboard() {
  const { tasks, insights } = useTodoStore();
  const { toast } = useToast();
  const [productivityQuestion, setProductivityQuestion] = useState('');
  const [aiResponses, setAiResponses] = useState([
    {
      id: '1',
      question: "When am I most productive?",
      answer: "Based on your task completion patterns, you tend to be most productive in the morning hours, especially between 9 AM and 11 AM. You've completed 45% of your tasks during this time window! 🌅",
    }
  ]);
  
  // Calculate streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    let date = new Date();
    
    while (true) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasCompletedTask = tasks.some(task => 
        task.completed && 
        task.createdAt.startsWith(dateStr)
      );
      
      if (!hasCompletedTask) break;
      currentStreak++;
      date = subDays(date, 1);
    }
    
    return currentStreak;
  }, [tasks]);

  // Prepare data for the completion trend chart
  const completionTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();
    
    return last7Days.map(date => {
      const dayTasks = tasks.filter(task => task.createdAt.startsWith(date));
      const completed = dayTasks.filter(t => t.completed).length;
      
      return {
        date: format(new Date(date), 'EEE'),
        completed,
        total: dayTasks.length,
      };
    });
  }, [tasks]);

  // Prepare data for the category distribution chart
  const categoryData = useMemo(() => {
    const categories = tasks.reduce((acc, task) => {
      const category = task.category || 'Other';
      if (!acc[category]) acc[category] = 0;
      acc[category]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  }, [tasks]);

  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  }, [tasks]);

  const handleAskQuestion = () => {
    if (!productivityQuestion.trim()) return;
    
    // Mock AI response generation
    const responses = [
      "Looking at your patterns, you complete most tasks in the morning. Consider scheduling important work during these peak hours! 🌅",
      "Your completion rate is highest for Work tasks. Health-related tasks often get postponed - maybe try scheduling them first? 💪",
      "You're showing great improvement! Your task completion rate has increased by 15% this week. Keep it up! 🚀",
      "I notice you tend to complete shorter tasks more often. Consider breaking down larger tasks into smaller chunks! 📝",
    ];
    
    setAiResponses(prev => [...prev, {
      id: Date.now().toString(),
      question: productivityQuestion,
      answer: responses[Math.floor(Math.random() * responses.length)],
    }]);
    
    setProductivityQuestion('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Productivity Story</h1>
          <p className="text-muted-foreground mt-1">
            Let's explore your productivity journey together! 🚀
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                You're on fire! 🔥
              </h2>
              <p className="text-muted-foreground">
                {streak > 0 ? (
                  `${streak} day streak! You've completed ${tasks.filter(t => t.completed).length} tasks so far.`
                ) : (
                  "Complete a task today to start your streak!"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Your task completion over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionTrendData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" />
                  <Bar dataKey="total" name="Total Tasks" fill="hsl(var(--muted))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Categories</CardTitle>
            <CardDescription>Distribution of your tasks by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask About Your Productivity</CardTitle>
          <CardDescription>
            Get insights about your work patterns and habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4 mb-4">
            <div className="space-y-4">
              {aiResponses.map((response) => (
                <div key={response.id} className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">{response.question}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="text-sm">{response.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              placeholder="Ask about your productivity patterns..."
              value={productivityQuestion}
              onChange={(e) => setProductivityQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            />
            <Button onClick={handleAskQuestion}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}