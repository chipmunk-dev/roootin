import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";

export function useVisibilityTracking(sessionId: string | undefined, enabled: boolean) {
  const markHidden = useAppStore((state) => state.markHidden);
  const markVisible = useAppStore((state) => state.markVisible);
  const classifyExit = useAppStore((state) => state.classifyExit);
  const [awaySeconds, setAwaySeconds] = useState<number>();

  useEffect(() => {
    if (!sessionId || !enabled) return;
    const handleVisibility = () => {
      if (document.hidden) {
        void markHidden(sessionId);
      } else {
        void markVisible(sessionId).then((duration) => {
          if (duration > 0) setAwaySeconds(duration);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    if (!document.hidden) {
      void markVisible(sessionId).then((duration) => {
        if (duration > 0) setAwaySeconds(duration);
      });
    }
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, markHidden, markVisible, sessionId]);

  const answer = async (planned: boolean) => {
    if (sessionId) await classifyExit(sessionId, planned);
    setAwaySeconds(undefined);
  };

  return { awaySeconds, answer };
}
