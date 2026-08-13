import { useCallback } from "react";
import type { AppSettings } from "../domain/types";

function playCalmTone(): void {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.6);
  oscillator.addEventListener("ended", () => void context.close());
}

export function useSessionEndEffects(settings: AppSettings) {
  return useCallback(
    (title: string) => {
      if (settings.audioEnabled) playCalmTone();
      if (settings.notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        new Notification(`${title} 종료`, { body: "다음 행동을 정할 시간입니다.", icon: "/focusflow-icon.svg" });
      }
    },
    [settings.audioEnabled, settings.notificationsEnabled]
  );
}
