import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { changeJapanesePhase, completeBasicJapanese, JAPANESE_PHASE_LABELS } from "../../domain/japanesePhase";
import type { JapanesePhase, JapaneseSettings } from "../../domain/types";
import styles from "./JapaneseSettingsSection.module.css";

interface JapaneseSettingsSectionProps {
  value: JapaneseSettings;
  onChange: (settings: JapaneseSettings) => void;
  onCompleteBasic: (settings: JapaneseSettings) => Promise<void>;
}

const phases = Object.entries(JAPANESE_PHASE_LABELS) as Array<[JapanesePhase, string]>;

export function JapaneseSettingsSection({ value, onChange, onCompleteBasic }: JapaneseSettingsSectionProps) {
  const [confirming, setConfirming] = useState(false);

  const set = <Key extends keyof JapaneseSettings>(key: Key, next: JapaneseSettings[Key]) => {
    onChange({ ...value, [key]: next });
  };

  const completeBasic = async () => {
    await onCompleteBasic(completeBasicJapanese(value));
    setConfirming(false);
  };

  return (
    <section className={styles.section}>
      <h2>Japanese Study Phase</h2>
      <div className={styles.phaseGrid}>
        {phases.map(([phase, label]) => (
          <label className={styles.phaseChoice} key={phase}>
            <input type="radio" name="japanese-phase" checked={value.phase === phase} onChange={() => onChange(changeJapanesePhase(value, phase))} />
            {label}
          </label>
        ))}
      </div>

      <div className={styles.optionList}>
        <label><input type="checkbox" checked={value.ankiVocabularyEnabled} onChange={(event) => set("ankiVocabularyEnabled", event.target.checked)} /> Anki Vocabulary</label>
        <label><input type="checkbox" checked={value.ankiKanjiEnabled} onChange={(event) => set("ankiKanjiEnabled", event.target.checked)} /> Anki Kanji</label>
        <label><input type="checkbox" checked={value.ankiGrammarEnabled} onChange={(event) => onChange({ ...value, ankiGrammarEnabled: event.target.checked, ankiGrammarManuallyConfigured: true })} /> Anki Grammar</label>
        <label><input type="checkbox" checked={value.todaiiEnabled} onChange={(event) => set("todaiiEnabled", event.target.checked)} /> Todaii</label>
      </div>

      {value.phase === "basic" && !value.ankiGrammarEnabled && <p className={styles.hint}>문법 카드는 기초일본어 종료 후 시작합니다.</p>}

      <div className={styles.targetGrid}>
        <label className={styles.field}><span>새 Vocabulary/Kanji 목표</span><input type="number" min="0" max="100" value={value.dailyNewVocabularyTarget} onChange={(event) => set("dailyNewVocabularyTarget", Math.max(0, Number(event.target.value)))} /></label>
        <label className={styles.field}><span>새 Grammar 목표</span><input type="number" min="0" max="50" value={value.dailyNewGrammarTarget} onChange={(event) => set("dailyNewGrammarTarget", Math.max(0, Number(event.target.value)))} /></label>
        <label className={styles.field}><span>Todaii 기본 모드</span><select value={value.todaiiDefaultMode} onChange={(event) => set("todaiiDefaultMode", event.target.value as JapaneseSettings["todaiiDefaultMode"])}><option value="mixed">Mixed</option><option value="reading">Reading</option><option value="listening">Listening</option></select></label>
        <label className={styles.field}><span>JLPT 시험일</span><input type="date" value={value.jlptExamDate ?? ""} onChange={(event) => set("jlptExamDate", event.target.value || undefined)} /></label>
      </div>

      <div className={styles.positionGrid}>
        <label className={styles.field}><span>Current Course</span><input value={value.yuhadayoCurrentCourse ?? ""} onChange={(event) => set("yuhadayoCurrentCourse", event.target.value)} placeholder="예: Level 6" /></label>
        <label className={styles.field}><span>Current Lesson</span><input value={value.yuhadayoCurrentLesson ?? ""} onChange={(event) => set("yuhadayoCurrentLesson", event.target.value)} placeholder="예: Lesson 12" /></label>
      </div>

      {value.phase === "basic" && (
        <div className={styles.complete}>
          <div><strong>기초일본어 과정</strong><p>완료하면 Level Up 단계로 이동합니다.</p></div>
          <Button variant="secondary" onClick={() => setConfirming(true)}>기초일본어 완료</Button>
        </div>
      )}

      {confirming && (
        <Modal title="기초일본어를 완료했나요?" onClose={() => setConfirming(false)}>
          <p>완료하면 Anki 문법 복습을 활성화하고 다음 단계로 이동할 수 있습니다.</p>
          <div className={styles.modalActions}><Button variant="secondary" onClick={() => setConfirming(false)}>취소</Button><Button onClick={() => void completeBasic()}>완료</Button></div>
        </Modal>
      )}
    </section>
  );
}
