import { useState, useEffect } from "react";
import { isMobileDevice } from "@/lib/utils";

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(isMobileDevice());
    };

    // Initial check
    checkIsMobile();

    // Listen for resize events to handle orientation changes
    window.addEventListener("resize", checkIsMobile);
    window.addEventListener("orientationchange", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
      window.removeEventListener("orientationchange", checkIsMobile);
    };
  }, []);

  return isMobile;
}
