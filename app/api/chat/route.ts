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

    const result = await createTaskWithAI(message);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Return a fallback response instead of an error
    return NextResponse.json({
      success: false,
      fallback: true,
      message: "I'm having trouble connecting to the AI service right now, but I can still help you with task management using my built-in responses! Try asking me to add a task or check your productivity stats.",
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}