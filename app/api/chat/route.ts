import { NextRequest, NextResponse } from 'next/server';
import { createTaskWithAI } from '@/lib/openai-service';

export async function POST(request: NextRequest) {
  try {
    const { message, taskSummary } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured',
          fallback: true,
          message: "I'd love to help you create tasks with AI, but the OpenAI API key isn't configured yet. For now, I can help you with basic task management using my built-in responses!"
        },
        { status: 200 }
      );
    }

    if (!process.env.OPENAI_ASSISTANT_ID) {
      return NextResponse.json(
        { 
          error: 'OpenAI Assistant ID is not configured',
          fallback: true,
          message: "The AI assistant isn't fully set up yet, but I can still help you manage tasks with my built-in capabilities!"
        },
        { status: 200 }
      );
    }

    // Get current date and time information
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: 'UTC' 
    });
    const dayOfWeek = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'UTC'
    });

    // Create enhanced context-aware message with detailed task information
    const contextualMessage = `Current date and time context:
- Today's date: ${currentDate} (${dayOfWeek})
- Current time: ${currentTime} UTC
- When user says "today", it refers to ${currentDate}
- When user says "tomorrow", it refers to ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

${taskSummary ? `DETAILED TASK SUMMARY DATA:

OVERVIEW METRICS:
- Total tasks: ${taskSummary.totalTasks}
- Completed tasks: ${taskSummary.completedTasks}
- Active tasks: ${taskSummary.activeTasks}
- Tasks completed today: ${taskSummary.completedToday}
- Tasks due today: ${taskSummary.dueToday}
- Overdue tasks: ${taskSummary.overdueTasks.length}
- High priority tasks: ${taskSummary.highPriorityTasks.length}
- Urgent tasks: ${taskSummary.urgentTasks.length}
- Current streak: ${taskSummary.streak} days
- Completion rate: ${taskSummary.completionRate}%
- Average tasks per day: ${taskSummary.avgTasksPerDay}
- Most productive time: ${taskSummary.mostProductiveTime || 'Not enough data'}

TASKS BY CATEGORY:
${JSON.stringify(taskSummary.tasksByCategory, null, 2)}

SPECIFIC TASKS COMPLETED TODAY (${taskSummary.completedTodayTasks.length} tasks):
${taskSummary.completedTodayTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}${task.completedAt ? ` - completed at ${new Date(task.completedAt).toLocaleTimeString('en-US', { hour12: true })}` : ''}`
).join('\n')}

TASKS DUE TODAY (${taskSummary.dueTodayTasks.length} tasks):
${taskSummary.dueTodayTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}`
).join('\n')}

OVERDUE TASKS (${taskSummary.overdueTasks.length} tasks):
${taskSummary.overdueTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}${task.dueDate ? ` - was due ${task.dueDate}` : ''}`
).join('\n')}

HIGH PRIORITY TASKS (${taskSummary.highPriorityTasks.length} tasks):
${taskSummary.highPriorityTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}${task.dueDate ? ` - due ${task.dueDate}` : ''}`
).join('\n')}

URGENT TASKS (${taskSummary.urgentTasks.length} tasks):
${taskSummary.urgentTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.dueDate ? ` - due ${task.dueDate}` : ''}`
).join('\n')}

RECENT COMPLETIONS (last ${taskSummary.recentCompletions.length} completed tasks):
${taskSummary.recentCompletions.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.completedAt ? ` - completed ${new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
).join('\n')}

CRITICAL INSTRUCTIONS FOR AI ASSISTANT:

1. PRODUCTIVITY ANALYSIS RESPONSES:
   - When users ask "What did I accomplish today?" or similar, ALWAYS list the specific tasks from completedTodayTasks array by title
   - Include completion times when available (from completedAt field)
   - Mention categories and priorities for context
   - Be specific: "You completed 'Review quarterly reports' (Work) at 10:30 AM" instead of "You completed 3 tasks"

2. PRIORITIZATION RESPONSES:
   - When asked about priorities, list specific tasks from overdueTasks and urgentTasks arrays
   - Include due dates and how many days overdue for overdue tasks
   - Reference actual task titles: "Your overdue task 'Prepare presentation slides' was due 3 days ago"

3. TODAY'S TASKS RESPONSES:
   - List specific tasks from dueTodayTasks array with their priorities and categories
   - Be specific: "Today you have 'Call dentist' (Health, high priority) and 'Buy groceries' (Personal, medium priority)"

4. OVERDUE ANALYSIS:
   - List specific overdue tasks from overdueTasks array
   - Calculate and mention how many days each task is overdue
   - Prioritize by urgency and due date

5. TASK CREATION:
   - When creating tasks, respond with JSON format:
   {
     "title": "Task title",
     "description": "Task description", 
     "priority": "low|medium|high|urgent",
     "category": "category name if mentioned",
     "dueDate": "YYYY-MM-DD format if date mentioned"
   }

6. GENERAL GUIDELINES:
   - ALWAYS reference specific task titles when discussing productivity, accomplishments, or priorities
   - Use the actual data provided - don't make up task names
   - Be encouraging and supportive while being specific
   - Provide actionable advice based on the user's actual task data
   - Use emojis and formatting to make responses engaging
   - When no specific tasks exist in a category, acknowledge that clearly

7. RESPONSE TONE:
   - Be personal and specific: "Your 'Review quarterly reports' task" not "one of your tasks"
   - Celebrate specific accomplishments: "Great job completing 'Call dentist' this morning!"
   - Provide specific guidance: "Focus on 'Prepare presentation slides' since it's 3 days overdue"

Remember: The user's actual task data is provided above. Use this real data to give personalized, specific responses that reference actual task titles, categories, priorities, and completion times.
` : ''}

User's request: ${message}

Please provide helpful, personalized advice based on the user's actual task data. If creating tasks, use the correct due dates based on the current date context. Always reference specific task titles when discussing productivity or priorities.`;

    const result = await createTaskWithAI(contextualMessage);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Provide specific error handling based on error type
    let fallbackMessage = "I'm having trouble connecting to the AI service right now, but I can still help you with task management using my built-in responses! Try asking me to add a task or check your productivity stats.";
    let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Handle specific OpenAI connection errors
    if (error instanceof Error) {
      if (error.message.includes('Unable to connect to OpenAI API')) {
        fallbackMessage = "I'm having trouble connecting to the OpenAI service. This might be due to network issues or an invalid API key. Please check your internet connection and API key configuration.";
      } else if (error.message.includes('Invalid OpenAI API key')) {
        fallbackMessage = "The OpenAI API key appears to be invalid. Please check your OPENAI_API_KEY environment variable and ensure it's a valid key with the necessary permissions.";
      } else if (error.message.includes('rate limit')) {
        fallbackMessage = "The OpenAI API rate limit has been exceeded. Please wait a moment and try again.";
      } else if (error.message.includes('temporarily unavailable')) {
        fallbackMessage = "The OpenAI service is temporarily unavailable. Please try again in a few minutes.";
      }
    }
    
    // Return a fallback response instead of an error
    return NextResponse.json({
      success: false,
      fallback: true,
      message: fallbackMessage,
      error: errorMessage,
      troubleshooting: {
        steps: [
          "Check your internet connection",
          "Verify your OpenAI API key is valid and has credits",
          "Ensure the OPENAI_ASSISTANT_ID is correct",
          "Try again in a few moments if this is a temporary issue"
        ]
      }
    });
  }
}