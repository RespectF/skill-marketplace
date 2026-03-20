import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function RouteProgressBar() {
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    // Start progress on navigation
    setActive(true);

    // Complete after a short delay (simulating route load)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActive(false);
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary transition-none"
        style={{
          width: active ? "90%" : "0%",
          opacity: active ? 1 : 0,
          transition: active
            ? "width 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease 200ms"
            : "opacity 200ms ease",
        }}
      />
    </div>
  );
}
