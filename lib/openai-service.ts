import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export interface TaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  dueDate?: string;
}

export interface OpenAIResponse {
  message: string;
  tasks?: TaskData[];
}

// Function to create a thread and get assistant response
export async function getAssistantResponse(userMessage: string): Promise<OpenAIResponse> {
  try {
    if (!ASSISTANT_ID) {
      throw new Error('OpenAI Assistant ID not configured');
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
      // Handle tool calls (task creation)
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];
      const createdTasks: TaskData[] = [];

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'create_task') {
          try {
            const taskData = JSON.parse(toolCall.function.arguments) as TaskData;
            createdTasks.push(taskData);
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: true, task: taskData }),
            });
          } catch (error) {
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: false, error: 'Invalid task data' }),
            });
          }
        }
      }

      // Submit tool outputs
      await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
        tool_outputs: toolOutputs,
      });

      // Wait for completion again
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      // Get the final response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      
      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        return {
          message: lastMessage.content[0].text.value,
          tasks: createdTasks,
        };
      }
    }

    if (runStatus.status === 'completed') {
      // Get messages
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      
      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        return {
          message: lastMessage.content[0].text.value,
        };
      }
    }

    throw new Error(`Assistant run failed with status: ${runStatus.status}`);
  } catch (error) {
    console.error('OpenAI Assistant error:', error);
    throw error;
  }
}

// Function to create an assistant with task creation capabilities
export async function createTaskAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Task Manager Assistant",
      instructions: `You are a helpful task management assistant. You can help users create, organize, and manage their tasks.

When users ask you to create tasks, use the create_task function to add them to their task list. You can create multiple tasks from a single request.

Guidelines for task creation:
- Extract clear, actionable task titles from user requests
- Set appropriate priorities based on urgency and importance
- Assign relevant categories when possible (Work, Personal, Health, Finance, Education)
- Set due dates when mentioned or when logical
- Add helpful descriptions to provide context

Always respond in a friendly, helpful manner and confirm what tasks you've created.`,
      model: "gpt-4-1106-preview",
      tools: [
        {
          type: "function",
          function: {
            name: "create_task",
            description: "Create a new task in the user's task list",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "The title of the task"
                },
                description: {
                  type: "string",
                  description: "Optional description providing more details about the task"
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "urgent"],
                  description: "The priority level of the task"
                },
                category: {
                  type: "string",
                  enum: ["Work", "Personal", "Health", "Finance", "Education"],
                  description: "The category this task belongs to"
                },
                dueDate: {
                  type: "string",
                  description: "Due date in YYYY-MM-DD format"
                }
              },
              required: ["title", "priority"]
            }
          }
        }
      ]
    });

    console.log('Assistant created with ID:', assistant.id);
    return assistant;
  } catch (error) {
    console.error('Error creating assistant:', error);
    throw error;
  }
}