import { useState } from "react";
import type { StudySession } from "../../domain/types";
import styles from "./StudyProtocol.module.css";

interface RecallPanelProps {
  session: StudySession;
  onUpdate: (session: StudySession) => Promise<void>;
}

export function RecallPanel({ session, onUpdate }: RecallPanelProps) {
  const [words, setWords] = useState(session.recallWords ?? "");
  const [unclear, setUnclear] = useState(session.recallUnclearNote ?? "");

  return (
    <section className={styles.panel} aria-label="Japanese recall protocol">
      <p className={styles.eyebrow}>JAPANESE RECALL</p>
      <h2>자료를 닫고 기억해봅니다.</h2>
      <p className={styles.hint}>1~2개만 남겨도 충분합니다.</p>
      <div className={styles.checkList}>
        <label><input type="checkbox" checked={session.recallGrammarExplained ?? false} onChange={(event) => void onUpdate({ ...session, recallGrammarExplained: event.target.checked })} /> 오늘 배운 문법 1개 설명</label>
        <label><input type="checkbox" checked={session.recallExampleMade ?? false} onChange={(event) => void onUpdate({ ...session, recallExampleMade: event.target.checked })} /> 예문 1개 만들기</label>
      </div>
      <label className={styles.field}><span>기억나는 새 단어 3개</span><input value={words} onChange={(event) => setWords(event.target.value)} onBlur={() => void onUpdate({ ...session, recallWords: words.trim() || undefined })} placeholder="단어를 쉼표로 구분" /></label>
      <label className={styles.field}><span>이해 안 되는 부분</span><textarea value={unclear} onChange={(event) => setUnclear(event.target.value)} onBlur={() => void onUpdate({ ...session, recallUnclearNote: unclear.trim() || undefined })} placeholder="필요할 때만 기록" /></label>
    </section>
  );
}
