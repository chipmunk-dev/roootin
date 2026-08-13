import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { isFocusSession } from "../../domain/routineEngine";
import { calculateElapsedSeconds } from "../../domain/timerEngine";
import type { SessionSwitchReason, StudySession } from "../../domain/types";
import styles from "../../pages/FocusPage.module.css";

const switchReasons: Array<{ value: SessionSwitchReason; label: string }> = [
  { value: "lowFocus", label: "집중력 저하" },
  { value: "tooDifficult", label: "생각보다 어려움" },
  { value: "tired", label: "몸이 피곤함" },
  { value: "schedule", label: "일정 발생" },
  { value: "goalChanged", label: "목표 변경" },
  { value: "other", label: "기타" }
];

interface SessionSwitchModalProps {
  session: StudySession;
  sessions: StudySession[];
  minimumMinutes: number;
  onClose: () => void;
  onSwitch: (targetId: string, reason: SessionSwitchReason) => void;
}

export function SessionSwitchModal({ session, sessions, minimumMinutes, onClose, onSwitch }: SessionSwitchModalProps) {
  const [reason, setReason] = useState<SessionSwitchReason>();
  const [targetId, setTargetId] = useState<string>();
  const elapsedMinutes = Math.floor(calculateElapsedSeconds(session) / 60);
  const needsNudge = elapsedMinutes < minimumMinutes;
  const candidates = sessions.filter((item) => item.id !== session.id && (item.status === "pending" || item.status === "paused") && isFocusSession(item));

  if (reason && targetId && needsNudge) {
    return (
      <Modal title="조금만 더 해볼까요?" onClose={onClose}>
        <p>현재 세션을 시작한 지 {elapsedMinutes}분입니다.</p>
        <p className={styles.hint}>가능하면 {minimumMinutes}분까지 이어가길 권합니다.</p>
        <div className={styles.modalActions}><Button variant="secondary" onClick={onClose}>계속</Button><Button onClick={() => onSwitch(targetId, reason)}>그래도 변경</Button></div>
      </Modal>
    );
  }

  return (
    <Modal title={reason ? "어떤 과목으로 바꿀까요?" : "왜 변경하나요?"} onClose={onClose}>
      <div className={styles.choiceList}>
        {!reason && switchReasons.map((item) => <button className={styles.choice} key={item.value} onClick={() => setReason(item.value)}>{item.label}</button>)}
        {reason && candidates.map((item) => <button className={styles.choice} key={item.id} onClick={() => needsNudge ? setTargetId(item.id) : onSwitch(item.id, reason)}>{item.title}</button>)}
      </div>
      {reason && candidates.length === 0 && <p className={styles.hint}>전환할 계획 세션이 없습니다.</p>}
    </Modal>
  );
}
