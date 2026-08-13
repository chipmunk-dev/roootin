import { useEffect, useRef } from "react";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockNavigator {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
}

export function useWakeLock(enabled: boolean): void {
  const sentinel = useRef<WakeLockSentinelLike>();

  useEffect(() => {
    let cancelled = false;
    const request = async () => {
      if (!enabled || document.hidden) return;
      try {
        const lock = await (navigator as unknown as WakeLockNavigator).wakeLock?.request("screen");
        if (!cancelled && lock) sentinel.current = lock;
      } catch {
        // Wake Lock은 선택 기능이므로 지원하지 않거나 거부되면 조용히 종료합니다.
      }
    };
    void request();
    const onVisibility = () => {
      if (!document.hidden && !sentinel.current) void request();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel.current?.release();
      sentinel.current = undefined;
    };
  }, [enabled]);
}
