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
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { 
  Sparkles, 
  Send, 
  Zap,
  Loader2,
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

export function AIAssistantPanel({ open, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      content: "Hi there! ✨ I'm your AI assistant. I can help you manage tasks, generate insights, or answer questions about your productivity. How can I help you today?",
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
      // Try to use OpenAI API first
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let aiResponse = '';
      
      if (data.fallback) {
        // Use fallback response if OpenAI is not configured
        aiResponse = data.message;
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
        // Fallback to built-in responses
        aiResponse = generateBuiltInResponse(currentInput);
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
      
      // Fallback to built-in responses on any error
      const fallbackResponse = generateBuiltInResponse(currentInput);
      
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

  const generateBuiltInResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    
    // Simple AI responses (fallback when OpenAI is not available)
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
      
      return `✨ I've created a new ${priority} priority task "${title}"${category ? ` in the ${category} category` : ''}. Ready to tackle it?`;
    } 
    else if (lowerInput.includes('how many task') || lowerInput.includes('task count')) {
      const activeCount = tasks.filter(t => !t.completed).length;
      const completedCount = tasks.filter(t => t.completed).length;
      
      return `📊 You have ${activeCount} active tasks and ${completedCount} completed tasks, for a total of ${tasks.length} tasks. ${activeCount > 0 ? "Let's get some done! 💪" : "You're all caught up! 🎉"}`;
    } 
    else if (lowerInput.includes('overdue')) {
      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = tasks.filter(t => 
        t.dueDate && t.dueDate < today && !t.completed
      );
      
      if (overdueTasks.length === 0) {
        return "🎉 Great news! You don't have any overdue tasks. You're staying on top of things!";
      } else {
        let response = `⚠️ You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:\n\n`;
        overdueTasks.forEach(task => {
          response += `• "${task.title}" (due: ${format(new Date(task.dueDate!), 'MMM dd')})\n`;
        });
        response += "\nLet's prioritize these! 🚀";
        return response;
      }
    } 
    else if (lowerInput.includes('help')) {
      return `🤖 I'm here to help! Here are some things you can ask me:

💡 **Task Management:**
• "Add a task to prepare presentation for work"
• "How many tasks do I have?"
• "What are my overdue tasks?"

📅 **Planning:**
• "What tasks do I have for today?"
• "Show me my high priority tasks"

🎯 **Productivity:**
• "Give me a productivity tip"
• "Analyze my work habits"

Just ask naturally - I'll understand! ✨`;
    }
    else if (lowerInput.includes('today') || lowerInput.includes('do today')) {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(t => 
        t.dueDate === today && !t.completed
      );
      
      if (todayTasks.length === 0) {
        return "📅 You don't have any tasks scheduled for today. Perfect time to get ahead on tomorrow's work! 🚀";
      } else {
        let response = `📋 You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} for today:\n\n`;
        todayTasks.forEach(task => {
          response += `• "${task.title}" (${task.priority} priority)\n`;
        });
        response += "\nYou've got this! 💪";
        return response;
      }
    }
    else if (lowerInput.includes('productivity tip') || lowerInput.includes('tip')) {
      const tips = [
        "🍅 Try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break. It's amazing for maintaining focus!",
        "🎯 Set only 1-3 important tasks for each day to avoid feeling overwhelmed. Quality over quantity!",
        "📝 Review your task list at the end of each day and plan for tomorrow. Future you will thank you!",
        "🧩 Break down large tasks into smaller, more manageable subtasks. Small wins build momentum!",
        "⏰ Consider using time blocking to allocate specific times for different types of work. Structure creates freedom!",
        "🌅 Start your day by completing one important task before checking emails or messages. Win the morning, win the day!",
      ];
      
      return tips[Math.floor(Math.random() * tips.length)];
    }
    else {
      return "🤔 I'm not quite sure about that one. Try asking me to add tasks, check overdue items, see today's tasks, or get productivity tips. I'm here to help make you more productive! ✨";
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white dark:bg-gray-900 border-l border-gray-200/50 dark:border-gray-700/50">
        <SheetHeader className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <SheetTitle className="text-lg font-semibold">AI Assistant</SheetTitle>
            <SheetDescription className="text-xs text-gray-600 dark:text-gray-400">
              Powered by advanced AI ✨
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
        
        <SheetFooter className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex w-full items-center space-x-3">
            <Input 
              placeholder="Ask me anything..." 
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
            <Button 
              onClick={() => {
                setInput("Give me a productivity tip");
                setTimeout(handleSendMessage, 100);
              }}
              variant="outline"
              size="icon"
              className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-105"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}