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
    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
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
          return {
            success: true,
            task: taskData,
            message: 'Task created successfully with AI assistance!'
          };
        } catch {
          // If not JSON, return the text response
          return {
            success: true,
            task: null,
            message: response
          };
        }
      }
    } else {
      throw new Error(`Assistant run failed with status: ${runStatus.status}`);
    }

    throw new Error('No response received from assistant');
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}