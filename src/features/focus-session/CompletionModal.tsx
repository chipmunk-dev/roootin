import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import type { StudySession } from "../../domain/types";
import styles from "../../pages/FocusPage.module.css";

interface CompletionModalProps {
  session: StudySession;
  needsReproduction: boolean;
  onCancel: () => void;
  onComplete: (patch: Partial<StudySession>) => void;
}

export function CompletionModal({ session, needsReproduction, onCancel, onComplete }: CompletionModalProps) {
  const [nextNote, setNextNote] = useState(session.nextNote ?? "");
  const [japaneseLearned, setJapaneseLearned] = useState(session.japaneseLearned ?? "");
  const [japaneseRecalled, setJapaneseRecalled] = useState(session.japaneseRecalled ?? false);
  const [japaneseExample, setJapaneseExample] = useState(session.japaneseExample ?? false);
  const [japaneseAnki, setJapaneseAnki] = useState(session.japaneseAnki ?? false);
  const [helpReproduced, setHelpReproduced] = useState(session.helpReproduced ?? false);
  const takesNext = session.type === "graphics" || session.type === "project";

  return (
    <Modal title={session.type === "math" ? "다음은 Graphics Apply" : "블록 마무리"} onClose={onCancel}>
      <div className={styles.form}>
        {session.type === "math" && <p>방금 배운 수학을 실제 코드에서 사용합니다.</p>}
        {takesNext && (
          <label>
            <strong>NEXT</strong>
            <span className={styles.hint} style={{ display: "block", margin: "0.35rem 0 0.6rem" }}>다음에 바로 시작할 행동</span>
            <textarea className={styles.input} value={nextNote} onChange={(event) => setNextNote(event.target.value)} placeholder="예: Projection Matrix를 constant buffer에 전달" autoFocus />
          </label>
        )}
        {session.type === "japanese" && (
          <>
            <label><strong>오늘 새로 배운 것</strong><textarea className={styles.input} value={japaneseLearned} onChange={(event) => setJapaneseLearned(event.target.value)} placeholder="한 가지만 적어도 충분합니다." /></label>
            <div className={styles.checkList}>
              <label><input type="checkbox" checked={japaneseRecalled} onChange={(event) => setJapaneseRecalled(event.target.checked)} /> 자료 없이 의미를 회상함</label>
              <label><input type="checkbox" checked={japaneseExample} onChange={(event) => setJapaneseExample(event.target.checked)} /> 직접 예문을 만들어봄</label>
              <label><input type="checkbox" checked={japaneseAnki} onChange={(event) => setJapaneseAnki(event.target.checked)} /> 필요한 내용 Anki에 추가함</label>
            </div>
          </>
        )}
        {needsReproduction && <label><input type="checkbox" checked={helpReproduced} onChange={(event) => setHelpReproduced(event.target.checked)} /> 도움받은 내용을 직접 다시 구현/풀이함</label>}
      </div>
      <div className={styles.modalActions}>
        <Button variant="secondary" onClick={onCancel}>조금 더 하기</Button>
        <Button onClick={() => onComplete({
          nextNote: nextNote.trim() || undefined,
          japaneseLearned: japaneseLearned.trim() || undefined,
          japaneseRecalled,
          japaneseExample,
          japaneseAnki,
          helpReproduced
        })}>완료</Button>
      </div>
    </Modal>
  );
}
