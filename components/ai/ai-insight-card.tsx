"use client";

import { AIInsight } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit, 
  TrendingUp, 
  ListTodo,
  Clock,
  AlertCircle
} from 'lucide-react';

interface AIInsightCardProps {
  insight: AIInsight;
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'productivity':
        return <TrendingUp className="h-4 w-4" />;
      case 'pattern':
        return <Clock className="h-4 w-4" />;
      case 'suggestion':
        return <ListTodo className="h-4 w-4" />;
      case 'reminder':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <BrainCircuit className="h-4 w-4" />;
    }
  };

  const getInsightTitle = () => {
    switch (insight.type) {
      case 'productivity':
        return 'Productivity Insight';
      case 'pattern':
        return 'Pattern Detected';
      case 'suggestion':
        return 'Task Suggestion';
      case 'reminder':
        return 'Smart Reminder';
      default:
        return 'AI Insight';
    }
  };

  const getCardStyle = () => {
    switch (insight.type) {
      case 'productivity':
        return 'border-l-4 border-l-chart-1';
      case 'pattern':
        return 'border-l-4 border-l-chart-2';
      case 'suggestion':
        return 'border-l-4 border-l-chart-3';
      case 'reminder':
        return 'border-l-4 border-l-chart-4';
      default:
        return '';
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getCardStyle()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getInsightIcon()}
            <CardTitle className="text-sm font-medium">{getInsightTitle()}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <BrainCircuit className="h-3 w-3 text-chart-3" />
          </div>
        </div>
        <CardDescription className="text-xs">
          Generated {new Date(insight.timestamp).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{insight.content}</p>
        {insight.type === 'suggestion' && (
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" className="text-xs">Apply Suggestion</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}