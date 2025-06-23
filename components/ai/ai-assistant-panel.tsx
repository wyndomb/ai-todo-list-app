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

interface TaskDetail {
  id: string;
  title: string;
  category?: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
}

interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completedToday: number;
  dueToday: number;
  tasksByCategory: Record<string, number>;
  completionRate: number;
  streak: number;
  mostProductiveTime?: string;
  avgTasksPerDay: number;
  
  // Detailed task arrays (these replace the number versions)
  completedTodayTasks: TaskDetail[];
  dueTodayTasks: TaskDetail[];
  overdueTasks: TaskDetail[];
  highPriorityTasks: TaskDetail[];
  urgentTasks: TaskDetail[];
  recentCompletions: TaskDetail[]; // Last 5 completed tasks
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

  // Helper function to convert task to TaskDetail
  const taskToDetail = (task: any): TaskDetail => ({
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
  });

  // Generate comprehensive task summary with detailed task arrays
  const generateTaskSummary = (): TaskSummary => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Basic counts
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeTasks = tasks.filter(t => !t.completed).length;
    
    // Today's metrics with detailed task arrays
    const completedTodayTasksArray = tasks.filter(t => 
      t.completed && t.completedAt && t.completedAt.startsWith(today)
    );
    const completedToday = completedTodayTasksArray.length;
    
    const dueTodayTasksArray = tasks.filter(t => 
      t.dueDate === today && !t.completed
    );
    const dueToday = dueTodayTasksArray.length;
    
    // Overdue tasks with details
    const overdueTasksArray = tasks.filter(t => 
      t.dueDate && t.dueDate < today && !t.completed
    );
    
    // Priority tasks with details
    const highPriorityTasksArray = tasks.filter(t => 
      !t.completed && (t.priority === 'high' || t.priority === 'urgent')
    );
    
    const urgentTasksArray = tasks.filter(t => 
      !t.completed && t.priority === 'urgent'
    );
    
    // Recent completions (last 5 completed tasks)
    const recentCompletionsArray = tasks
      .filter(t => t.completed && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);
    
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
        task.completed && task.completedAt && task.completedAt.startsWith(dateStr)
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
      tasksByCategory,
      completionRate,
      streak,
      mostProductiveTime,
      avgTasksPerDay,
      
      // Detailed task arrays
      completedTodayTasks: completedTodayTasksArray.map(taskToDetail),
      dueTodayTasks: dueTodayTasksArray.map(taskToDetail),
      overdueTasks: overdueTasksArray.map(taskToDetail),
      highPriorityTasks: highPriorityTasksArray.map(taskToDetail),
      urgentTasks: urgentTasksArray.map(taskToDetail),
      recentCompletions: recentCompletionsArray.map(taskToDetail),
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
    
    // Productivity analysis queries with specific task details
    if (lowerInput.includes('what did i') && (lowerInput.includes('today') || lowerInput.includes('accomplish'))) {
      if (summary.completedToday === 0) {
        let response = `📊 **Today's Summary:**\n\nYou haven't completed any tasks today yet, but don't worry!`;
        
        if (summary.dueToday > 0) {
          response += `\n\n📅 **Tasks due today:**`;
          summary.dueTodayTasks.forEach(task => {
            const priorityEmoji = task.priority === 'urgent' ? '🚨' : 
                                 task.priority === 'high' ? '🔥' : 
                                 task.priority === 'medium' ? '⚡' : '📝';
            response += `\n${priorityEmoji} "${task.title}"${task.category ? ` (${task.category})` : ''}`;
          });
        }
        
        if (summary.overdueTasks.length > 0) {
          response += `\n\n⚠️ **Overdue tasks that need attention:**`;
          summary.overdueTasks.slice(0, 3).forEach(task => {
            response += `\n🚨 "${task.title}"${task.dueDate ? ` (was due ${format(new Date(task.dueDate), 'MMM dd')})` : ''}`;
          });
          if (summary.overdueTasks.length > 3) {
            response += `\n... and ${summary.overdueTasks.length - 3} more overdue tasks`;
          }
        }
        
        response += `\n\n💪 **Suggestion:** Start with your ${summary.urgentTasks.length > 0 ? 'urgent' : 'high priority'} tasks to build momentum!`;
        return response;
      } else {
        let response = `🎉 **Great work today!**\n\n✅ **You've completed ${summary.completedToday} task${summary.completedToday === 1 ? '' : 's'} today:**\n`;
        
        summary.completedTodayTasks.forEach(task => {
          const timeCompleted = task.completedAt ? format(new Date(task.completedAt), 'h:mm a') : '';
          response += `\n• "${task.title}"${task.category ? ` (${task.category})` : ''}${timeCompleted ? ` - completed at ${timeCompleted}` : ''}`;
        });
        
        response += `\n\n📈 **Overall completion rate:** ${summary.completionRate}%\n🔥 **Current streak:** ${summary.streak} day${summary.streak === 1 ? '' : 's'}`;
        
        if (summary.dueToday > 0) {
          response += `\n\n📋 **Still due today:**`;
          summary.dueTodayTasks.forEach(task => {
            const priorityEmoji = task.priority === 'urgent' ? '🚨' : 
                                 task.priority === 'high' ? '🔥' : 
                                 task.priority === 'medium' ? '⚡' : '📝';
            response += `\n${priorityEmoji} "${task.title}"${task.category ? ` (${task.category})` : ''}`;
          });
        } else {
          response += `\n\n🎯 All caught up for today!`;
        }
        
        response += `\n\nKeep up the excellent work! 🚀`;
        return response;
      }
    }
    
    if (lowerInput.includes('productivity') && (lowerInput.includes('week') || lowerInput.includes('month') || lowerInput.includes('level'))) {
      const productivityLevel = summary.completionRate >= 80 ? 'Excellent' : 
                              summary.completionRate >= 60 ? 'Good' : 
                              summary.completionRate >= 40 ? 'Fair' : 'Needs Improvement';
      
      let response = `📊 **Productivity Analysis:**\n\n🎯 **Overall Performance:** ${productivityLevel} (${summary.completionRate}% completion rate)\n📈 **Tasks completed:** ${summary.completedTasks} out of ${summary.totalTasks}\n🔥 **Current streak:** ${summary.streak} day${summary.streak === 1 ? '' : 's'}\n📅 **Daily average:** ${summary.avgTasksPerDay} tasks per day`;
      
      if (summary.recentCompletions.length > 0) {
        response += `\n\n✅ **Recent accomplishments:**`;
        summary.recentCompletions.forEach(task => {
          const timeAgo = task.completedAt ? format(new Date(task.completedAt), 'MMM dd') : '';
          response += `\n• "${task.title}"${task.category ? ` (${task.category})` : ''}${timeAgo ? ` - ${timeAgo}` : ''}`;
        });
      }
      
      response += `\n\n**Category Breakdown:**\n${Object.entries(summary.tasksByCategory).map(([cat, count]) => `• ${cat}: ${count} tasks`).join('\n')}`;
      
      response += `\n\n${summary.completionRate >= 70 ? '🌟 You\'re doing great! Keep maintaining this momentum.' : '💡 **Tip:** Try breaking down larger tasks into smaller, manageable chunks to boost your completion rate.'}`;
      return response;
    }
    
    if (lowerInput.includes('prioritize') || lowerInput.includes('priority') || lowerInput.includes('focus')) {
      let priorityAdvice = '🎯 **Priority Recommendations:**\n\n';
      
      if (summary.overdueTasks.length > 0) {
        priorityAdvice += `🚨 **URGENT - Overdue Tasks:**`;
        summary.overdueTasks.slice(0, 3).forEach(task => {
          priorityAdvice += `\n• "${task.title}"${task.dueDate ? ` (was due ${format(new Date(task.dueDate), 'MMM dd')})` : ''}${task.category ? ` - ${task.category}` : ''}`;
        });
        if (summary.overdueTasks.length > 3) {
          priorityAdvice += `\n• ... and ${summary.overdueTasks.length - 3} more overdue tasks`;
        }
        priorityAdvice += `\n\n`;
      }
      
      if (summary.urgentTasks.length > 0) {
        priorityAdvice += `⚡ **High Priority - Urgent Tasks:**`;
        summary.urgentTasks.forEach(task => {
          priorityAdvice += `\n• "${task.title}"${task.dueDate ? ` (due ${format(new Date(task.dueDate), 'MMM dd')})` : ''}${task.category ? ` - ${task.category}` : ''}`;
        });
        priorityAdvice += `\n\n`;
      }
      
      if (summary.dueToday > 0) {
        priorityAdvice += `📅 **Due Today:**`;
        summary.dueTodayTasks.forEach(task => {
          const priorityEmoji = task.priority === 'urgent' ? '🚨' : 
                               task.priority === 'high' ? '🔥' : 
                               task.priority === 'medium' ? '⚡' : '📝';
          priorityAdvice += `\n${priorityEmoji} "${task.title}"${task.category ? ` - ${task.category}` : ''}`;
        });
        priorityAdvice += `\n\n`;
      }
      
      if (summary.overdueTasks.length === 0 && summary.urgentTasks.length === 0 && summary.dueToday === 0) {
        priorityAdvice += '✨ Great news! No urgent or overdue tasks. Focus on your high-priority items or plan ahead.\n\n';
      }
      
      priorityAdvice += `💡 **Strategy:** ${summary.mostProductiveTime ? `Work on important tasks during your most productive time (${summary.mostProductiveTime}).` : 'Start with quick wins to build momentum, then tackle larger tasks.'}`;
      
      return priorityAdvice;
    }
    
    // Enhanced overdue analysis with specific tasks
    if (lowerInput.includes('overdue')) {
      if (summary.overdueTasks.length === 0) {
        return "🎉 **Excellent!** You don't have any overdue tasks. You're staying on top of things!\n\n✨ This is a great sign of good time management. Keep up the momentum!";
      } else {
        let response = `⚠️ **Overdue Tasks Alert**\n\nYou have ${summary.overdueTasks.length} overdue task${summary.overdueTasks.length > 1 ? 's' : ''}:\n\n`;
        
        summary.overdueTasks.forEach(task => {
          const daysPast = task.dueDate ? Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const priorityEmoji = task.priority === 'urgent' ? '🚨' : 
                               task.priority === 'high' ? '🔥' : 
                               task.priority === 'medium' ? '⚡' : '📝';
          response += `${priorityEmoji} "${task.title}"${task.category ? ` (${task.category})` : ''} - ${daysPast} day${daysPast === 1 ? '' : 's'} overdue\n`;
        });
        
        response += `\n💡 **Recommendation:** Start with the oldest or most important overdue tasks first. Consider breaking them into smaller chunks if they're overwhelming.`;
        return response;
      }
    }
    
    // Enhanced today's tasks with specific details
    if (lowerInput.includes('today') || lowerInput.includes('do today')) {
      if (summary.dueToday === 0) {
        let response = `📅 **Today's Schedule:** All clear!\n\nNo tasks scheduled for today.`;
        
        if (summary.overdueTasks.length > 0) {
          response += ` However, you have ${summary.overdueTasks.length} overdue task${summary.overdueTasks.length === 1 ? '' : 's'} that could use attention:\n\n`;
          summary.overdueTasks.slice(0, 3).forEach(task => {
            response += `🚨 "${task.title}"${task.category ? ` (${task.category})` : ''}\n`;
          });
          if (summary.overdueTasks.length > 3) {
            response += `... and ${summary.overdueTasks.length - 3} more`;
          }
        } else {
          response += ' Perfect time to get ahead on tomorrow\'s work or plan for the future! 🚀';
        }
        
        return response;
      } else {
        let response = `📋 **Today's Tasks** (${summary.dueToday} task${summary.dueToday > 1 ? 's' : ''}):\n\n`;
        
        summary.dueTodayTasks.forEach(task => {
          const priorityEmoji = task.priority === 'urgent' ? '🚨' : 
                               task.priority === 'high' ? '🔥' : 
                               task.priority === 'medium' ? '⚡' : '📝';
          response += `${priorityEmoji} "${task.title}"${task.category ? ` (${task.category})` : ''} - ${task.priority} priority\n`;
        });
        
        response += `\n💪 You've got this! ${summary.completedToday > 0 ? `Already completed ${summary.completedToday} task${summary.completedToday === 1 ? '' : 's'} today.` : 'Start with the highest priority items.'}`;
        return response;
      }
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
    
    // Enhanced task counting with recent activity
    if (lowerInput.includes('how many task') || lowerInput.includes('task count')) {
      let response = `📊 **Task Overview:**\n\n📋 **Total tasks:** ${summary.totalTasks}\n✅ **Completed:** ${summary.completedTasks}\n⏳ **Active:** ${summary.activeTasks}\n📅 **Due today:** ${summary.dueToday}\n⚠️ **Overdue:** ${summary.overdueTasks.length}\n🔥 **High priority:** ${summary.highPriorityTasks.length}\n\n📈 **Completion rate:** ${summary.completionRate}%\n🎯 **Daily average:** ${summary.avgTasksPerDay} tasks`;
      
      if (summary.recentCompletions.length > 0) {
        response += `\n\n🎉 **Recent completions:**`;
        summary.recentCompletions.slice(0, 3).forEach(task => {
          response += `\n• "${task.title}"${task.category ? ` (${task.category})` : ''}`;
        });
      }
      
      response += `\n\n${summary.activeTasks > 0 ? "Let's get some done! 💪" : "You're all caught up! 🎉"}`;
      return response;
    }
    
    // Enhanced productivity tips
    if (lowerInput.includes('productivity tip') || lowerInput.includes('tip')) {
      const tips = [
        `🍅 **Pomodoro Power:** Try 25-minute focused work sessions with 5-minute breaks. With your current ${summary.avgTasksPerDay} tasks per day, this could help you stay focused!`,
        `🎯 **Priority Matrix:** You have ${summary.highPriorityTasks.length} high-priority tasks. Focus on important AND urgent items first, then plan the important but not urgent ones.`,
        `📝 **Daily Review:** With a ${summary.completionRate}% completion rate, try reviewing your task list each evening to plan tomorrow. This could boost your productivity!`,
        `🧩 **Task Chunking:** Break large tasks into smaller pieces. Your ${summary.streak}-day streak shows you're consistent - smaller tasks can help maintain momentum!`,
        `⏰ **Time Blocking:** ${summary.mostProductiveTime ? `Since you're most productive in the ${summary.mostProductiveTime}, schedule important tasks during this time.` : 'Try scheduling specific times for different types of work to create structure.'}`,
        `🌅 **Morning Wins:** Start each day by completing one important task before checking emails. With ${summary.dueToday} tasks due today, pick one to tackle first!`,
      ];
      
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Enhanced help
    if (lowerInput.includes('help')) {
      return `🤖 **I'm your AI Productivity Coach!** Here's how I can help:\n\n📊 **Productivity Analysis:**\n• "What did I accomplish today/this week?"\n• "How's my productivity level?"\n• "Show me my completion rate"\n\n🎯 **Priority & Focus:**\n• "What should I prioritize?"\n• "What's most urgent?"\n• "Help me focus"\n\n📋 **Task Management:**\n• "Add a task to review quarterly reports"\n• "How many tasks do I have?"\n• "What's overdue?"\n\n📈 **Insights & Patterns:**\n• "When am I most productive?"\n• "What's my daily average?"\n• "Analyze my work habits"\n\nJust ask naturally - I understand context and provide personalized advice based on your actual task data! ✨`;
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