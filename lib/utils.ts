import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to detect if user is on a mobile device
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Check if Chrome DevTools mobile simulation is active
  const isDevToolsMobile =
    (navigator as any).userAgentData?.mobile ||
    window.screen.orientation !== undefined ||
    window.orientation !== undefined;

  // Return true if device has touch capability AND (small screen OR mobile user agent)
  // OR if it's a small screen (for testing/DevTools)
  return (hasTouch && (isSmallScreen || isMobileUserAgent)) || isSmallScreen;
}
