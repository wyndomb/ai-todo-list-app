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
  AlertCircle,
} from 'lucide-react';
import { AIMessage } from '@/components/ai/ai-message';
import { TaskData } from '@/lib/openai-service';

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  tasks?: TaskData[];
}

export function AIAssistantPanel({ open, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      content: "Hi there! ✨ I'm your AI assistant powered by OpenAI. I can help you create tasks using natural language. Just tell me what you need to do and I'll create organized tasks for you!",
      sender: 'assistant',
      timestamp: new Date().toISOString(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { addTask } = useTodoStore();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      // Create tasks if any were generated
      if (data.tasks && data.tasks.length > 0) {
        for (const taskData of data.tasks) {
          await addTask({
            title: taskData.title,
            description: taskData.description,
            completed: false,
            priority: taskData.priority,
            category: taskData.category,
            dueDate: taskData.dueDate,
            aiGenerated: true,
          });
        }

        toast({
          title: "✨ Tasks Created!",
          description: `I've created ${data.tasks.length} task${data.tasks.length > 1 ? 's' : ''} for you.`,
          duration: 3000,
        });
      }
      
      const aiMessage: Message = {
        id: uuidv4(),
        content: data.message,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        tasks: data.tasks,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      const errorMessage: Message = {
        id: uuidv4(),
        content: "I'm sorry, I encountered an error while processing your request. Please make sure your OpenAI API key and Assistant ID are properly configured.",
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => handleSendMessage(), 100);
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
              Powered by OpenAI ✨
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map(message => (
              <div key={message.id}>
                <AIMessage
                  message={message.content}
                  isUser={message.sender === 'user'}
                />
                
                {/* Show created tasks */}
                {message.tasks && message.tasks.length > 0 && (
                  <div className="mt-2 ml-11 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created tasks:</p>
                    {message.tasks.map((task, index) => (
                      <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-green-600 dark:text-green-300 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded">
                            {task.priority}
                          </span>
                          {task.category && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
                              {task.category}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Due: {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Create a task to review my monthly budget")}
              className="text-xs"
            >
              💰 Budget Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("I need to prepare for my presentation next week")}
              className="text-xs"
            >
              📊 Presentation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Create workout tasks for this week")}
              className="text-xs"
            >
              💪 Workout
            </Button>
          </div>
        </div>
        
        <SheetFooter className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex w-full items-center space-x-3">
            <Input 
              placeholder="Tell me what you need to do..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
              className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={() => handleQuickAction("Give me a productivity tip")}
              variant="outline"
              size="icon"
              disabled={isTyping}
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