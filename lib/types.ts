export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  aiGenerated?: boolean;
  aiSuggestions?: string[];
  // New fields for subtasks
  parentId?: string;
  // New fields for recurring tasks
  isRecurringTemplate?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string;
  originalTaskId?: string; // Links generated instances back to template
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface AIInsight {
  id: string;
  type: 'productivity' | 'pattern' | 'suggestion' | 'reminder';
  content: string;
  timestamp: string;
  relatedTasks?: string[];
}