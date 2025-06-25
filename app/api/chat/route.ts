import { NextRequest, NextResponse } from "next/server";
import { createTaskWithAI } from "@/lib/openai-service";

export async function POST(request: NextRequest) {
  console.log("🚀 AI Chat API route accessed - starting request processing");

  try {
    const { message, taskSummary, intent } = await request.json();
    console.log("📝 Request data received:", {
      messageLength: message?.length,
      intent,
      hasSummary: !!taskSummary,
      summaryKeys: taskSummary ? Object.keys(taskSummary) : [],
    });

    if (!message) {
      console.log("❌ No message provided in request");
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log("⚠️ OpenAI API key not configured");
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured",
          fallback: true,
          message:
            "I'd love to help you create tasks with AI, but the OpenAI API key isn't configured yet. For now, I can help you with basic task management using my built-in responses!",
        },
        { status: 200 }
      );
    }

    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.log("⚠️ OpenAI Assistant ID not configured");
      return NextResponse.json(
        {
          error: "OpenAI Assistant ID is not configured",
          fallback: true,
          message:
            "The AI assistant isn't fully set up yet, but I can still help you manage tasks with my built-in capabilities!",
        },
        { status: 200 }
      );
    }

    console.log(
      "✅ OpenAI configuration validated, proceeding with AI request"
    );

    // Get current date and time information
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const currentTime = now.toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: "UTC",
    });
    const dayOfWeek = now.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });

    // Create dynamic context-aware message based on intent and available data
    let contextualMessage = `Current date: ${currentDate} (${dayOfWeek})
User intent: ${intent || "general"}

`;

    // Conditionally add task summary sections based on what data is available
    if (taskSummary) {
      contextualMessage += `TASK DATA:\n\n`;

      // Core metrics (always included)
      if (taskSummary.totalTasks !== undefined) {
        contextualMessage += `Overview: ${taskSummary.totalTasks} total, ${taskSummary.completedTasks} completed (${taskSummary.completionRate}%), ${taskSummary.streak} day streak\n\n`;
      }

      // Today-specific data
      if (
        taskSummary.completedTodayTasks &&
        taskSummary.completedTodayTasks.length > 0
      ) {
        contextualMessage += `Completed today (${taskSummary.completedTodayTasks.length}):\n`;
        taskSummary.completedTodayTasks.forEach((task: any) => {
          contextualMessage += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${task.priority ? ` [${task.priority}]` : ""}\n`;
        });
        contextualMessage += "\n";
      }

      if (taskSummary.dueTodayTasks && taskSummary.dueTodayTasks.length > 0) {
        contextualMessage += `Due today (${taskSummary.dueTodayTasks.length}):\n`;
        taskSummary.dueTodayTasks.forEach((task: any) => {
          contextualMessage += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${task.priority ? ` [${task.priority}]` : ""}\n`;
        });
        contextualMessage += "\n";
      }

      // Priority and overdue data
      if (taskSummary.overdueTasks && taskSummary.overdueTasks.length > 0) {
        contextualMessage += `Overdue (${taskSummary.overdueTasks.length}):\n`;
        taskSummary.overdueTasks.forEach((task: any) => {
          contextualMessage += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${task.priority ? ` [${task.priority}]` : ""}${
            task.dueDate ? ` - due ${task.dueDate}` : ""
          }\n`;
        });
        contextualMessage += "\n";
      }

      if (taskSummary.urgentTasks && taskSummary.urgentTasks.length > 0) {
        contextualMessage += `Urgent (${taskSummary.urgentTasks.length}):\n`;
        taskSummary.urgentTasks.forEach((task: any) => {
          contextualMessage += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${task.dueDate ? ` - due ${task.dueDate}` : ""}\n`;
        });
        contextualMessage += "\n";
      }

      if (
        taskSummary.highPriorityTasks &&
        taskSummary.highPriorityTasks.length > 0
      ) {
        contextualMessage += `High priority (${taskSummary.highPriorityTasks.length}):\n`;
        taskSummary.highPriorityTasks.forEach((task: any) => {
          contextualMessage += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }${task.dueDate ? ` - due ${task.dueDate}` : ""}\n`;
        });
        contextualMessage += "\n";
      }

      // Productivity data
      if (
        taskSummary.recentCompletions &&
        taskSummary.recentCompletions.length > 0
      ) {
        contextualMessage += `Recent completions (${taskSummary.recentCompletions.length}):\n`;
        taskSummary.recentCompletions.forEach((task: any) => {
          contextualMessage += `• "${task.title}"${
            task.category ? ` (${task.category})` : ""
          }\n`;
        });
        contextualMessage += "\n";
      }

      if (taskSummary.tasksByCategory) {
        contextualMessage += `Categories: ${JSON.stringify(
          taskSummary.tasksByCategory
        )}\n`;
      }

      if (taskSummary.avgTasksPerDay !== undefined) {
        contextualMessage += `Avg tasks/day: ${taskSummary.avgTasksPerDay}\n`;
      }

      contextualMessage += `\nINSTRUCTIONS:
- Reference specific task titles from data above
- For task creation, respond with JSON: {"title": "...", "priority": "low/medium/high/urgent", "category": "...", "dueDate": "YYYY-MM-DD"}
- Be specific, encouraging, and use actual task details
- Focus on ${intent} intent
`;
    }

    contextualMessage += `\nUser: ${message}`;

    console.log(
      "📤 Sending request to OpenAI service with message length:",
      contextualMessage.length
    );

    try {
      const result = await createTaskWithAI(contextualMessage);

      console.log("✅ OpenAI service returned result:", {
        success: result?.success,
        hasTask: !!result?.task,
        messageLength: result?.message?.length,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (apiError) {
      console.error("📞 ERROR calling OpenAI service from API route:", {
        message:
          apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
      });

      // Handle specific, known errors from the service layer gracefully
      if (apiError instanceof Error) {
        if (apiError.message.includes("Invalid OpenAI API key")) {
          return NextResponse.json(
            {
              error: "Invalid OpenAI API key",
              fallback: true,
              message:
                "The OpenAI API key seems to be invalid. Please check your configuration. I can still help with basic tasks!",
            },
            { status: 200 } // Return 200 to not show a scary error to the user
          );
        }
        if (apiError.message.includes("Unable to connect")) {
          return NextResponse.json(
            {
              error: "Connection to OpenAI failed",
              fallback: true,
              message:
                "I couldn't connect to the AI service. Please check your internet connection. In the meantime, I can help with basic tasks.",
            },
            { status: 200 }
          );
        }
      }

      // For any other errors, rethrow to be caught by the outer block
      throw apiError;
    }
  } catch (error) {
    console.error("💥 CRITICAL ERROR in Chat API:", {
      error: error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });

    // Provide specific error handling based on error type
    let fallbackMessage =
      "I'm having trouble connecting to the AI service right now, but I can still help you with task management using my built-in responses! Try asking me to add a task or check your productivity stats.";
    let errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle specific OpenAI connection errors
    if (error instanceof Error) {
      if (error.message.includes("Unable to connect to OpenAI API")) {
        fallbackMessage =
          "I'm having trouble connecting to the OpenAI service. This might be due to network issues or an invalid API key. Please check your internet connection and API key configuration.";
      } else if (error.message.includes("rate limit")) {
        fallbackMessage =
          "The OpenAI API rate limit has been exceeded. Please wait a moment and try again.";
      } else if (error.message.includes("temporarily unavailable")) {
        fallbackMessage =
          "The OpenAI service is temporarily unavailable. Please try again in a few minutes.";
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
          "Try again in a few moments if this is a temporary issue",
        ],
      },
    });
  }
}
