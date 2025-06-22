"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTodoStore } from '@/lib/store';
import { format, isToday, isPast, startOfDay, endOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { 
  Sparkles, 
  Send, 
  Zap,
  Loader2,
  TrendingUp,
  Target,
  Calendar,
  Clock,
} from 'lucide-react';
import { AIMessage } from '@/components/ai/ai-message';

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completedToday: number;
  dueToday: number;
  overdueTasks: number;
  highPriorityTasks: number;
  urgentTasks: number;
  tasksByCategory: Record<string, number>;
  completionRate: number;
  streak: number;
  mostProductiveTime?: string;
  avgTasksPerDay: number;
}

export function AIAssistantPanel({ open, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      content: "Hi there! ✨ I'm your AI productivity coach. I can help you manage tasks, analyze your productivity patterns, and provide personalized insights. Try asking me:\n\n• \"What did I accomplish today?\"\n• \"What should I prioritize?\"\n• \"How's my productivity this week?\"\n• \"Add a task to review quarterly reports\"\n\nHow can I help you today?",
      sender: 'assistant',
      timestamp: new Date().toISOString(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { tasks, addTask, categories } = useTodoStore();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Generate comprehensive task summary
  const generateTaskSummary = (): TaskSummary => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Basic counts
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeTasks = tasks.filter(t => !t.completed).length;
    
    // Today's metrics
    const completedToday = tasks.filter(t => 
      t.completed && t.createdAt.startsWith(today)
    ).length;
    
    const dueToday = tasks.filter(t => 
      t.dueDate === today && !t.completed
    ).length;
    
    // Overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.dueDate && t.dueDate < today && !t.completed
    ).length;
    
    // Priority tasks
    const highPriorityTasks = tasks.filter(t => 
      !t.completed && (t.priority === 'high' || t.priority === 'urgent')
    ).length;
    
    const urgentTasks = tasks.filter(t => 
      !t.completed && t.priority === 'urgent'
    ).length;
    
    // Tasks by category
    const tasksByCategory = tasks.reduce((acc, task) => {
      const category = task.category || 'No Category';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate streak (consecutive days with completed tasks)
    let streak = 0;
    let currentDate = new Date();
    
    while (streak < 30) { // Check up to 30 days back
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasCompletedTask = tasks.some(task => 
        task.completed && task.createdAt.startsWith(dateStr)
      );
      
      if (!hasCompletedTask && streak > 0) break;
      if (hasCompletedTask) streak++;
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Average tasks per day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    const tasksLast7Days = last7Days.reduce((total, date) => {
      return total + tasks.filter(t => t.createdAt.startsWith(date)).length;
    }, 0);
    
    const avgTasksPerDay = Math.round(tasksLast7Days / 7 * 10) / 10;
    
    // Most productive time (simplified - could be enhanced with actual time tracking)
    const mostProductiveTime = completedTasks > 5 ? "Morning (9-11 AM)" : undefined;
    
    return {
      totalTasks,
      completedTasks,
      activeTasks,
      completedToday,
      dueToday,
      overdueTasks,
      highPriorityTasks,
      urgentTasks,
      tasksByCategory,
      completionRate,
      streak,
      mostProductiveTime,
      avgTasksPerDay,
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsTyping(true);
    
    try {
      // Generate task summary for AI context
      const taskSummary = generateTaskSummary();
      
      // Try to use OpenAI API first
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentInput,
          taskSummary: taskSummary
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let aiResponse = '';
      
      if (data.fallback) {
        // Use enhanced fallback response with task summary
        aiResponse = generateEnhancedBuiltInResponse(currentInput, taskSummary);
      } else if (data.success && data.data) {
        // Handle successful OpenAI response
        if (data.data.task) {
          // AI returned structured task data
          await addTask(data.data.task);
          aiResponse = data.data.message || "I've created that task for you! ✨";
        } else {
          // AI returned a text response
          aiResponse = data.data.message;
        }
      } else {
        // Fallback to enhanced built-in responses
        aiResponse = generateEnhancedBuiltInResponse(currentInput, taskSummary);
      }

      // Add AI response
      const aiMessage: Message = {
        id: uuidv4(),
        content: aiResponse,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to enhanced built-in responses on any error
      const taskSummary = generateTaskSummary();
      const fallbackResponse = generateEnhancedBuiltInResponse(currentInput, taskSummary);
      
      const aiMessage: Message = {
        id: uuidv4(),
        content: fallbackResponse,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateEnhancedBuiltInResponse = (userInput: string, summary: TaskSummary) => {
    const lowerInput = userInput.toLowerCase();
    
    // Productivity analysis queries
    if (lowerInput.includes('what did i') && (lowerInput.includes('today') || lowerInput.includes('accomplish'))) {
      if (summary.completedToday === 0) {
        return `📊 **Today's Summary:**\n\nYou haven't completed any tasks today yet, but don't worry! You have ${summary.dueToday} task${summary.dueToday === 1 ? '' : 's'} due today.\n\n${summary.overdueTasks > 0 ? `⚠️ You also have ${summary.overdueTasks} overdue task${summary.overdueTasks === 1 ? '' : 's'} that need attention.\n\n` : ''}💪 **Suggestion:** Start with your ${summary.urgentTasks > 0 ? 'urgent' : 'high priority'} tasks to build momentum!`;
      } else {
        return `🎉 **Great work today!**\n\n✅ You've completed **${summary.completedToday}** task${summary.completedToday === 1 ? '' : 's'} today!\n📈 Overall completion rate: **${summary.completionRate}%**\n🔥 Current streak: **${summary.streak}** day${summary.streak === 1 ? '' : 's'}\n\n${summary.dueToday > 0 ? `📋 You still have ${summary.dueToday} task${summary.dueToday === 1 ? '' : 's'} due today.` : '🎯 All caught up for today!'}\n\nKeep up the excellent work! 🚀`;
      }
    }
    
    if (lowerInput.includes('productivity') && (lowerInput.includes('week') || lowerInput.includes('month') || lowerInput.includes('level'))) {
      const productivityLevel = summary.completionRate >= 80 ? 'Excellent' : 
                              summary.completionRate >= 60 ? 'Good' : 
                              summary.completionRate >= 40 ? 'Fair' : 'Needs Improvement';
      
      return `📊 **Productivity Analysis:**\n\n🎯 **Overall Performance:** ${productivityLevel} (${summary.completionRate}% completion rate)\n📈 **Tasks completed:** ${summary.completedTasks} out of ${summary.totalTasks}\n🔥 **Current streak:** ${summary.streak} day${summary.streak === 1 ? '' : 's'}\n📅 **Daily average:** ${summary.avgTasksPerDay} tasks per day\n\n**Category Breakdown:**\n${Object.entries(summary.tasksByCategory).map(([cat, count]) => `• ${cat}: ${count} tasks`).join('\n')}\n\n${summary.completionRate >= 70 ? '🌟 You\'re doing great! Keep maintaining this momentum.' : '💡 **Tip:** Try breaking down larger tasks into smaller, manageable chunks to boost your completion rate.'}`;
    }
    
    if (lowerInput.includes('prioritize') || lowerInput.includes('priority') || lowerInput.includes('focus')) {
      let priorityAdvice = '🎯 **Priority Recommendations:**\n\n';
      
      if (summary.overdueTasks > 0) {
        priorityAdvice += `🚨 **URGENT:** You have ${summary.overdueTasks} overdue task${summary.overdueTasks === 1 ? '' : 's'}. These should be your top priority!\n\n`;
      }
      
      if (summary.urgentTasks > 0) {
        priorityAdvice += `⚡ **High Priority:** ${summary.urgentTasks} urgent task${summary.urgentTasks === 1 ? '' : 's'} need immediate attention.\n\n`;
      }
      
      if (summary.dueToday > 0) {
        priorityAdvice += `📅 **Due Today:** ${summary.dueToday} task${summary.dueToday === 1 ? '' : 's'} scheduled for today.\n\n`;
      }
      
      if (summary.overdueTasks === 0 && summary.urgentTasks === 0 && summary.dueToday === 0) {
        priorityAdvice += '✨ Great news! No urgent or overdue tasks. Focus on your high-priority items or plan ahead.\n\n';
      }
      
      priorityAdvice += `💡 **Strategy:** ${summary.mostProductiveTime ? `Work on important tasks during your most productive time (${summary.mostProductiveTime}).` : 'Start with quick wins to build momentum, then tackle larger tasks.'}`;
      
      return priorityAdvice;
    }
    
    // Task creation with enhanced context
    if (lowerInput.includes('add task') || lowerInput.includes('create task')) {
      const titleMatch = userInput.match(/task\s+(?:called|named|titled)?\s*['":]?([^'":]*)['"]?/i);
      const title = titleMatch ? titleMatch[1].trim() : 'New task';
      
      // Try to extract priority
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (lowerInput.includes('urgent')) priority = 'urgent';
      else if (lowerInput.includes('high priority')) priority = 'high';
      else if (lowerInput.includes('low priority')) priority = 'low';
      
      // Try to extract category
      let category: string | undefined;
      categories.forEach(cat => {
        if (lowerInput.includes(cat.name.toLowerCase())) {
          category = cat.name;
        }
      });
      
      // Add the task
      addTask({
        title: title,
        description: `Created via AI assistant: "${userInput}"`,
        completed: false,
        priority: priority,
        category: category,
        aiGenerated: true,
      });
      
      return `✨ **Task Created Successfully!**\n\n📝 **"${title}"**\n🎯 Priority: ${priority}\n${category ? `📁 Category: ${category}\n` : ''}🤖 AI Generated\n\n${summary.activeTasks + 1} active tasks total. ${priority === 'urgent' ? 'This urgent task has been added to your priority list!' : 'Ready to tackle it?'} 💪`;
    }
    
    // Enhanced task counting
    if (lowerInput.includes('how many task') || lowerInput.includes('task count')) {
      return `📊 **Task Overview:**\n\n📋 **Total tasks:** ${summary.totalTasks}\n✅ **Completed:** ${summary.completedTasks}\n⏳ **Active:** ${summary.activeTasks}\n📅 **Due today:** ${summary.dueToday}\n⚠️ **Overdue:** ${summary.overdueTasks}\n🔥 **High priority:** ${summary.highPriorityTasks}\n\n📈 **Completion rate:** ${summary.completionRate}%\n🎯 **Daily average:** ${summary.avgTasksPerDay} tasks\n\n${summary.activeTasks > 0 ? "Let's get some done! 💪" : "You're all caught up! 🎉"}`;
    }
    
    // Enhanced overdue analysis
    if (lowerInput.includes('overdue')) {
      if (summary.overdueTasks === 0) {
        return "🎉 **Excellent!** You don't have any overdue tasks. You're staying on top of things!\n\n✨ This is a great sign of good time management. Keep up the momentum!";
      } else {
        const overdueTasks = tasks.filter(t => 
          t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && !t.completed
        );
        
        let response = `⚠️ **Overdue Tasks Alert**\n\nYou have ${summary.overdueTasks} overdue task${summary.overdueTasks > 1 ? 's' : ''}:\n\n`;
        overdueTasks.slice(0, 5).forEach(task => {
          response += `• "${task.title}" (due: ${format(new Date(task.dueDate!), 'MMM dd')})\n`;
        });
        
        if (overdueTasks.length > 5) {
          response += `... and ${overdueTasks.length - 5} more\n`;
        }
        
        response += `\n💡 **Recommendation:** Start with the oldest or most important overdue tasks first. Consider breaking them into smaller chunks if they're overwhelming.`;
        return response;
      }
    }
    
    // Enhanced help
    if (lowerInput.includes('help')) {
      return `🤖 **I'm your AI Productivity Coach!** Here's how I can help:\n\n📊 **Productivity Analysis:**\n• "What did I accomplish today/this week?"\n• "How's my productivity level?"\n• "Show me my completion rate"\n\n🎯 **Priority & Focus:**\n• "What should I prioritize?"\n• "What's most urgent?"\n• "Help me focus"\n\n📋 **Task Management:**\n• "Add a task to review quarterly reports"\n• "How many tasks do I have?"\n• "What's overdue?"\n\n📈 **Insights & Patterns:**\n• "When am I most productive?"\n• "What's my daily average?"\n• "Analyze my work habits"\n\nJust ask naturally - I understand context and provide personalized advice based on your actual task data! ✨`;
    }
    
    // Enhanced today's tasks
    if (lowerInput.includes('today') || lowerInput.includes('do today')) {
      const todayTasks = tasks.filter(t => 
        t.dueDate === new Date().toISOString().split('T')[0] && !t.completed
      );
      
      if (todayTasks.length === 0) {
        return `📅 **Today's Schedule:** All clear!\n\nNo tasks scheduled for today. ${summary.overdueTasks > 0 ? `However, you have ${summary.overdueTasks} overdue task${summary.overdueTasks === 1 ? '' : 's'} that could use attention.` : 'Perfect time to get ahead on tomorrow\'s work or plan for the future!'} 🚀`;
      } else {
        let response = `📋 **Today's Tasks** (${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''}):\n\n`;
        todayTasks.forEach(task => {
          const priorityEmoji = task.priority === 'urgent' ? '🚨' : 
                               task.priority === 'high' ? '🔥' : 
                               task.priority === 'medium' ? '⚡' : '📝';
          response += `${priorityEmoji} "${task.title}" (${task.priority} priority)\n`;
        });
        response += `\n💪 You've got this! ${summary.completedToday > 0 ? `Already completed ${summary.completedToday} task${summary.completedToday === 1 ? '' : 's'} today.` : 'Start with the highest priority items.'}`;
        return response;
      }
    }
    
    // Enhanced productivity tips
    if (lowerInput.includes('productivity tip') || lowerInput.includes('tip')) {
      const tips = [
        `🍅 **Pomodoro Power:** Try 25-minute focused work sessions with 5-minute breaks. With your current ${summary.avgTasksPerDay} tasks per day, this could help you stay focused!`,
        `🎯 **Priority Matrix:** You have ${summary.highPriorityTasks} high-priority tasks. Focus on important AND urgent items first, then plan the important but not urgent ones.`,
        `📝 **Daily Review:** With a ${summary.completionRate}% completion rate, try reviewing your task list each evening to plan tomorrow. This could boost your productivity!`,
        `🧩 **Task Chunking:** Break large tasks into smaller pieces. Your ${summary.streak}-day streak shows you're consistent - smaller tasks can help maintain momentum!`,
        `⏰ **Time Blocking:** ${summary.mostProductiveTime ? `Since you're most productive in the ${summary.mostProductiveTime}, schedule important tasks during this time.` : 'Try scheduling specific times for different types of work to create structure.'}`,
        `🌅 **Morning Wins:** Start each day by completing one important task before checking emails. With ${summary.dueToday} tasks due today, pick one to tackle first!`,
      ];
      
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Default enhanced response
    return `🤔 I'd love to help you with that! Here are some things you can ask me:\n\n📊 **Productivity Analysis:**\n• "What did I accomplish today?"\n• "How's my productivity this week?"\n• "What should I prioritize?"\n\n📋 **Task Management:**\n• "Add a task to prepare presentation"\n• "What's overdue?"\n• "How many tasks do I have?"\n\n💡 **Get Tips:**\n• "Give me a productivity tip"\n• "Help me focus"\n\nI analyze your actual task data (${summary.totalTasks} tasks, ${summary.completionRate}% completion rate) to give you personalized advice! ✨`;
  };

  // Quick action buttons
  const quickActions = [
    {
      icon: TrendingUp,
      label: "Productivity",
      action: "How's my productivity this week?"
    },
    {
      icon: Target,
      label: "Prioritize",
      action: "What should I prioritize?"
    },
    {
      icon: Calendar,
      label: "Today",
      action: "What did I accomplish today?"
    },
    {
      icon: Zap,
      label: "Tips",
      action: "Give me a productivity tip"
    }
  ];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white dark:bg-gray-900 border-l border-gray-200/50 dark:border-gray-700/50">
        <SheetHeader className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <SheetTitle className="text-lg font-semibold">AI Productivity Coach</SheetTitle>
            <SheetDescription className="text-xs text-gray-600 dark:text-gray-400">
              Personalized insights & task management ✨
            </SheetDescription>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map(message => (
              <AIMessage
                key={message.id}
                message={message.content}
                isUser={message.sender === 'user'}
              />
            ))}
            
            {isTyping && (
              <div className="flex gap-3 items-start animate-slide-fade">
                <div className="h-8 w-8 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 max-w-[80%]">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
        
        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInput(action.action);
                  setTimeout(handleSendMessage, 100);
                }}
                className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <SheetFooter className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex w-full items-center space-x-3">
            <Input 
              placeholder="Ask about your productivity..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}