import OpenAI from 'openai';

// Initialize OpenAI client with proper error handling
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export async function createTaskWithAI(userMessage: string) {
  // Check if OpenAI is properly configured
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.');
  }

  if (!ASSISTANT_ID) {
    throw new Error('OpenAI Assistant ID is not configured. Please add OPENAI_ASSISTANT_ID to your environment variables.');
  }

  try {
    // Test the connection first with a simple API call
    try {
      await openai.models.list();
    } catch (connectionError) {
      if (connectionError instanceof Error) {
        if (connectionError.message.includes('Connection error') || connectionError.message.includes('FetchError')) {
          throw new Error('Unable to connect to OpenAI API. Please check your internet connection and API key validity.');
        }
        if (connectionError.message.includes('401') || connectionError.message.includes('Unauthorized')) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in the environment variables.');
        }
      }
      throw connectionError;
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread with comprehensive system instructions
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `${userMessage}

CRITICAL SYSTEM INSTRUCTIONS FOR AI PRODUCTIVITY COACH:

You are an advanced AI productivity coach with access to detailed, real-time task data. Your responses must be highly personalized and specific.

CORE RESPONSIBILITIES:

1. **SPECIFIC TASK ANALYSIS**: When users ask about productivity, accomplishments, or priorities, you MUST reference actual task titles from the provided data. Never give generic responses.

2. **DETAILED PRODUCTIVITY RESPONSES**: 
   - For "What did I accomplish today?": List specific completed tasks by title, include completion times, categories, and priorities
   - For "What should I prioritize?": List specific overdue and urgent tasks by title with due dates
   - For "What's due today?": List specific tasks due today with their priorities and categories
   - For "What's overdue?": List specific overdue tasks with how many days they're past due

3. **TASK CREATION**: When users want to create tasks, respond with this exact JSON format:
   ```json
   {
     "title": "Specific task title",
     "description": "Detailed description if provided",
     "priority": "low|medium|high|urgent",
     "category": "category name if mentioned or inferred",
     "dueDate": "YYYY-MM-DD format if date mentioned"
   }
   ```

4. **RESPONSE REQUIREMENTS**:
   - ALWAYS use actual task titles from the provided data
   - Include specific details: completion times, due dates, categories, priorities
   - Be encouraging and supportive while being factual
   - Use emojis and formatting for engagement
   - Provide actionable, specific advice

5. **EXAMPLE TRANSFORMATIONS**:
   
   **BAD (Generic)**: "You completed 3 tasks today. Good job!"
   
   **GOOD (Specific)**: "🎉 Great work today! You completed:
   • 'Review quarterly reports' (Work) at 10:30 AM
   • 'Call dentist for appointment' (Health) at 2:15 PM  
   • 'Update project timeline' (Work) at 4:45 PM"

   **BAD (Generic)**: "You have some overdue tasks to focus on."
   
   **GOOD (Specific)**: "🚨 Priority Alert: You have 2 overdue tasks:
   • 'Prepare presentation slides' (Work) - 3 days overdue
   • 'Submit expense report' (Finance) - 1 day overdue"

6. **DATA USAGE GUIDELINES**:
   - Use the completedTodayTasks array for today's accomplishments
   - Use the overdueTasks array for overdue analysis
   - Use the dueTodayTasks array for today's schedule
   - Use the urgentTasks and highPriorityTasks arrays for prioritization
   - Use the recentCompletions array for recent activity analysis
   - Reference specific task titles, categories, priorities, and dates

7. **PERSONALIZATION REQUIREMENTS**:
   - Address the user's actual work patterns and habits
   - Reference their completion rate, streak, and productivity metrics
   - Provide advice based on their specific task categories and priorities
   - Celebrate specific accomplishments by task name
   - Give targeted advice for their actual overdue and urgent tasks

8. **FORMATTING STANDARDS**:
   - Use bullet points for task lists
   - Include emojis for visual appeal
   - Bold important information
   - Use specific times, dates, and numbers
   - Structure responses with clear sections

CRITICAL: Your responses must feel like they come from someone who knows the user's specific tasks and work patterns. Always reference actual task titles and details from the provided data. Never give generic advice that could apply to anyone.

If the user is asking for productivity insights, prioritization advice, or analysis, respond with natural language that includes specific task details. If they're creating a task, respond with the JSON format above.`,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Wait for the run to complete with timeout
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Assistant response timed out. Please try again.');
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      
      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const response = lastMessage.content[0].text.value;
        
        // Try to parse the response as JSON to extract task data
        try {
          const taskData = JSON.parse(response);
          // Validate that it's a task object
          if (taskData.title && typeof taskData.title === 'string') {
            return {
              success: true,
              task: taskData,
              message: 'Task created successfully with AI assistance!'
            };
          }
        } catch {
          // If not JSON or not a valid task, return the text response
          return {
            success: true,
            task: null,
            message: response
          };
        }
      }
    } else if (runStatus.status === 'failed') {
      throw new Error(`Assistant run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
    } else {
      throw new Error(`Assistant run completed with unexpected status: ${runStatus.status}`);
    }

    throw new Error('No response received from assistant');
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Connection error') || error.message.includes('FetchError')) {
        throw new Error('Unable to connect to OpenAI API. Please check your internet connection and try again.');
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Invalid OpenAI API key. Please verify your API key is correct and has the necessary permissions.');
      }
      if (error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a few moments.');
      }
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error('OpenAI API is temporarily unavailable. Please try again later.');
      }
    }
    
    throw error;
  }
}