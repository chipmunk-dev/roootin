import { useEffect, useState } from "react";

export function useClock(active = true, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, intervalMs);
    return () => window.clearInterval(interval);
  }, [active, intervalMs]);

  return now;
}
