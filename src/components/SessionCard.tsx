import type { StudySession } from "../domain/types";
import styles from "./ui.module.css";

interface SessionCardProps {
  session: StudySession;
  onDurationChange: (minutes: number) => void;
}

export function SessionCard({ session, onDurationChange }: SessionCardProps) {
  const statusClass = session.status === "completed" ? styles.statusDone : session.status === "running" || session.status === "paused" ? styles.statusRunning : "";
  return (
    <div className={styles.sessionCard}>
      <span className={styles.sessionNumber}>{session.order}</span>
      <div className={styles.sessionTitle}>
        {session.title}
        {session.isOptional && <span>OPTIONAL</span>}
      </div>
      <div className={styles.sessionMeta}>
        {session.status === "pending" ? (
          <label>
            <span className="srOnly">{session.title} 시간(분)</span>
            <input
              className={styles.durationInput}
              type="number"
              min="1"
              max="240"
              inputMode="numeric"
              value={session.plannedDurationMinutes}
              onChange={(event) => onDurationChange(Number(event.target.value))}
              aria-label={`${session.title} 시간(분)`}
            />
            <span aria-hidden="true"> m</span>
          </label>
        ) : (
          <span>{session.plannedDurationMinutes}m</span>
        )}
        <span className={`${styles.statusDot} ${statusClass}`} aria-label={session.status} />
      </div>
    </div>
  );
}
