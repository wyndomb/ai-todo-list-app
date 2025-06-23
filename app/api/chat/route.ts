import { NextRequest, NextResponse } from 'next/server';
import { createTaskWithAI } from '@/lib/openai-service';

export async function POST(request: NextRequest) {
  console.log('🚀 AI Chat API route accessed - starting request processing');
  
  try {
    const { message, taskSummary, intent } = await request.json();
    console.log('📝 Request data received:', { 
      messageLength: message?.length, 
      intent, 
      hasSummary: !!taskSummary,
      summaryKeys: taskSummary ? Object.keys(taskSummary) : []
    });

    if (!message) {
      console.log('❌ No message provided in request');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured');
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
      console.log('⚠️ OpenAI Assistant ID not configured');
      return NextResponse.json(
        { 
          error: 'OpenAI Assistant ID is not configured',
          fallback: true,
          message: "The AI assistant isn't fully set up yet, but I can still help you manage tasks with my built-in capabilities!"
        },
        { status: 200 }
      );
    }

    console.log('✅ OpenAI configuration validated, proceeding with AI request');

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

    // Create dynamic context-aware message based on intent and available data
    let contextualMessage = `Current date and time context:
- Today's date: ${currentDate} (${dayOfWeek})
- Current time: ${currentTime} UTC
- When user says "today", it refers to ${currentDate}
- When user says "tomorrow", it refers to ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

DETECTED USER INTENT: ${intent || 'general'}

`;

    // Conditionally add task summary sections based on what data is available
    if (taskSummary) {
      contextualMessage += `RELEVANT TASK DATA:\n\n`;
      
      // Core metrics (always included)
      if (taskSummary.totalTasks !== undefined) {
        contextualMessage += `OVERVIEW METRICS:
- Total tasks: ${taskSummary.totalTasks}
- Completed tasks: ${taskSummary.completedTasks}
- Active tasks: ${taskSummary.activeTasks}
- Completion rate: ${taskSummary.completionRate}%
- Current streak: ${taskSummary.streak} days

`;
      }
      
      // Today-specific data
      if (taskSummary.completedTodayTasks || taskSummary.dueTodayTasks) {
        contextualMessage += `TODAY'S ACTIVITY:\n`;
        
        if (taskSummary.completedTodayTasks && taskSummary.completedTodayTasks.length > 0) {
          contextualMessage += `TASKS COMPLETED TODAY (${taskSummary.completedTodayTasks.length} tasks):
${taskSummary.completedTodayTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}${task.completedAt ? ` - completed at ${new Date(task.completedAt).toLocaleTimeString('en-US', { hour12: true })}` : ''}`
).join('\n')}

`;
        }
        
        if (taskSummary.dueTodayTasks && taskSummary.dueTodayTasks.length > 0) {
          contextualMessage += `TASKS DUE TODAY (${taskSummary.dueTodayTasks.length} tasks):
${taskSummary.dueTodayTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}`
).join('\n')}

`;
        }
      }
      
      // Priority and overdue data
      if (taskSummary.overdueTasks || taskSummary.urgentTasks || taskSummary.highPriorityTasks) {
        contextualMessage += `PRIORITY TASKS:\n`;
        
        if (taskSummary.overdueTasks && taskSummary.overdueTasks.length > 0) {
          contextualMessage += `OVERDUE TASKS (${taskSummary.overdueTasks.length} tasks):
${taskSummary.overdueTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}${task.dueDate ? ` - was due ${task.dueDate}` : ''}`
).join('\n')}

`;
        }
        
        if (taskSummary.urgentTasks && taskSummary.urgentTasks.length > 0) {
          contextualMessage += `URGENT TASKS (${taskSummary.urgentTasks.length} tasks):
${taskSummary.urgentTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.dueDate ? ` - due ${task.dueDate}` : ''}`
).join('\n')}

`;
        }
        
        if (taskSummary.highPriorityTasks && taskSummary.highPriorityTasks.length > 0) {
          contextualMessage += `HIGH PRIORITY TASKS (${taskSummary.highPriorityTasks.length} tasks):
${taskSummary.highPriorityTasks.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.priority ? ` [${task.priority} priority]` : ''}${task.dueDate ? ` - due ${task.dueDate}` : ''}`
).join('\n')}

`;
        }
      }
      
      // Productivity data
      if (taskSummary.recentCompletions || taskSummary.tasksByCategory || taskSummary.avgTasksPerDay) {
        contextualMessage += `PRODUCTIVITY INSIGHTS:\n`;
        
        if (taskSummary.avgTasksPerDay !== undefined) {
          contextualMessage += `- Average tasks per day: ${taskSummary.avgTasksPerDay}
`;
        }
        
        if (taskSummary.mostProductiveTime) {
          contextualMessage += `- Most productive time: ${taskSummary.mostProductiveTime}
`;
        }
        
        if (taskSummary.tasksByCategory) {
          contextualMessage += `- Tasks by category: ${JSON.stringify(taskSummary.tasksByCategory)}
`;
        }
        
        if (taskSummary.recentCompletions && taskSummary.recentCompletions.length > 0) {
          contextualMessage += `
RECENT COMPLETIONS (last ${taskSummary.recentCompletions.length} completed tasks):
${taskSummary.recentCompletions.map(task => 
  `- "${task.title}"${task.category ? ` (${task.category})` : ''}${task.completedAt ? ` - completed ${new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
).join('\n')}

`;
        }
      }
      
      contextualMessage += `CRITICAL INSTRUCTIONS FOR AI ASSISTANT:

1. **SPECIFIC TASK ANALYSIS**: Reference actual task titles from the provided data. Never give generic responses.

2. **INTENT-BASED RESPONSES**: 
   - For "${intent}" intent, focus on the most relevant data provided above
   - Use specific task titles, completion times, due dates, and categories
   - Be encouraging and supportive while being factual

3. **TASK CREATION**: When users want to create tasks, respond with this exact JSON format:
   \`\`\`json
   {
     "title": "Specific task title",
     "description": "Detailed description if provided",
     "priority": "low|medium|high|urgent",
     "category": "category name if mentioned or inferred",
     "dueDate": "YYYY-MM-DD format if date mentioned"
   }
   \`\`\`

4. **PERSONALIZATION**: 
   - Address the user's actual work patterns and habits
   - Reference their completion rate, streak, and productivity metrics
   - Provide advice based on their specific task categories and priorities
   - Celebrate specific accomplishments by task name

5. **RESPONSE REQUIREMENTS**:
   - ALWAYS use actual task titles from the provided data
   - Include specific details: completion times, due dates, categories, priorities
   - Use emojis and formatting for engagement
   - Provide actionable, specific advice

Remember: Use the specific task data provided above to give personalized, detailed responses that reference actual task titles and details.
`;
    }

    contextualMessage += `

User's request: ${message}

Please provide helpful, personalized advice based on the user's actual task data. If creating tasks, use the correct due dates based on the current date context. Always reference specific task titles when discussing productivity or priorities.`;

    console.log('📤 Sending request to OpenAI service with message length:', contextualMessage.length);
    
    const result = await createTaskWithAI(contextualMessage);
    
    console.log('✅ OpenAI service returned result:', { 
      success: result?.success, 
      hasTask: !!result?.task,
      messageLength: result?.message?.length 
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('💥 CRITICAL ERROR in Chat API:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined
    });
    
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