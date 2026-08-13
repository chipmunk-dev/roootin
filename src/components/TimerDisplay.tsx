import { formatTimer } from "../domain/timerEngine";
import styles from "./ui.module.css";

interface TimerDisplayProps {
  seconds: number;
  label?: string;
}

export function TimerDisplay({ seconds, label = "남은 시간" }: TimerDisplayProps) {
  const formatted = formatTimer(seconds);
  return (
    <div className={styles.timer} role="timer" aria-label={`${label} ${formatted}`} aria-live="off">
      {formatted}
    </div>
  );
}
