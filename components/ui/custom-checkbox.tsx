"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CustomCheckbox({
  checked,
  onChange,
  onClick,
  className,
  size = "md",
}: CustomCheckboxProps) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        onClick={onClick}
        className={cn(
          "appearance-none cursor-pointer transition-all duration-200 rounded-md border-2",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
          checked
            ? "bg-primary border-primary"
            : "bg-transparent hover:border-primary",
          className
        )}
      />
      {checked && (
        <Check
          className={cn(
            "absolute inset-0 text-white pointer-events-none",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )}
        />
      )}
    </div>
  );
}
