"use client";

import { cn } from "@/lib/utils";

interface AIMessageProps {
  message: string;
  isUser: boolean;
}

export function AIMessage({ message, isUser }: AIMessageProps) {
  return (
    <div 
      className={cn(
        "flex gap-2",
        isUser && "justify-end"
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <BrainCircuitIcon className="h-4 w-4 text-primary" />
        </div>
      )}
      <div 
        className={cn(
          "px-3 py-2 rounded-lg max-w-[80%] animate-slide-up",
          isUser 
            ? "bg-primary text-primary-foreground ml-12" 
            : "bg-muted text-foreground"
        )}
      >
        <div className="whitespace-pre-line">{message}</div>
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <UserIcon className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

function BrainCircuitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
      <path d="m15.7 10.4-1.17.4-5.5-5.5" />
      <path d="m8.3 13.6 1.17-.4 6.37 6.37" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}