import { useState } from "react";
import { Button } from "../../components/Button";
import { applyJlptPracticeType, JLPT_PRACTICE_PRESETS } from "../../domain/japaneseRoutineEngine";
import type { JlptPracticeType, StudySession } from "../../domain/types";
import styles from "./StudyProtocol.module.css";

interface JlptPracticePanelProps {
  session: StudySession;
  onUpdate: (session: StudySession) => Promise<void>;
}

const practiceTypes: JlptPracticeType[] = ["vocabulary", "grammar", "reading", "listening", "mixed", "custom"];

export function JlptPracticePanel({ session, onUpdate }: JlptPracticePanelProps) {
  const selected = session.jlptPracticeType ?? "mixed";
  const [customMinutes, setCustomMinutes] = useState(session.plannedDurationMinutes);

  const choose = (type: JlptPracticeType) => {
    void onUpdate(applyJlptPracticeType(session, type, customMinutes));
  };

  return (
    <section className={styles.panel} aria-label="JLPT practice setup">
      <p className={styles.eyebrow}>JLPT PRACTICE</p>
      <p className={styles.hint}>새 지식보다 문제·오답·회상에 집중합니다.</p>
      <div className={styles.practiceGrid}>
        {practiceTypes.map((type) => (
          <Button key={type} variant={selected === type ? "primary" : "secondary"} aria-pressed={selected === type} onClick={() => choose(type)}>
            {type === "mixed" ? "Full / Mixed" : type[0].toUpperCase() + type.slice(1)}
            <small>{type === "custom" ? `${customMinutes}m` : `${JLPT_PRACTICE_PRESETS[type]}m`}</small>
          </Button>
        ))}
      </div>
      {selected === "custom" && <label className={styles.field}><span>Custom duration · 분</span><input type="number" min="1" max="180" value={customMinutes} onChange={(event) => setCustomMinutes(Math.max(1, Number(event.target.value)))} onBlur={() => void onUpdate(applyJlptPracticeType(session, "custom", customMinutes))} /></label>}
    </section>
  );
}
