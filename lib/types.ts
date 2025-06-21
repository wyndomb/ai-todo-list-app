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
  // Fields for subtasks
  parentId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt?: string;
  userId?: string;
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