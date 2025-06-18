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

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
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