import { NextRequest, NextResponse } from 'next/server';
import { createTaskWithAI } from '@/lib/openai-service';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

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

    // Create context-aware message with current date information
    const contextualMessage = `Current date and time context:
- Today's date: ${currentDate} (${dayOfWeek})
- Current time: ${currentTime} UTC
- When user says "today", it refers to ${currentDate}
- When user says "tomorrow", it refers to ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

User's request: ${message}

Please create tasks with the correct due dates based on this current date context. If the user mentions "today", use ${currentDate} as the due date.`;

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