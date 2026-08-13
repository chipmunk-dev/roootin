import { useState } from "react";
import { Button } from "../../components/Button";
import { todaiiLevelRecommendation } from "../../domain/japanesePhase";
import type { JapaneseSettings, StudySession, TodaiiMode } from "../../domain/types";
import styles from "./StudyProtocol.module.css";

interface TodaiiPanelProps {
  session: StudySession;
  settings: JapaneseSettings;
  onUpdate: (session: StudySession) => Promise<void>;
}

export function TodaiiPanel({ session, settings, onUpdate }: TodaiiPanelProps) {
  const [topic, setTopic] = useState(session.todaiiTopic ?? "");
  const [summary, setSummary] = useState(session.todaiiSummary ?? "");
  const [guess, setGuess] = useState(session.todaiiListeningGuess ?? "");
  const [words, setWords] = useState<string[]>([...(session.todaiiVocabulary ?? []), "", "", "", "", ""].slice(0, 5));
  const mode = session.todaiiMode ?? (session.japaneseMode === "todaiiListening" ? "listening" : "reading");
  const phase = session.japanesePhase ?? settings.phase;

  const changeMode = (next: TodaiiMode) => {
    void onUpdate({
      ...session,
      todaiiMode: next,
      japaneseMode: next === "listening" ? "todaiiListening" : "todaiiReading"
    });
  };

  const updateWord = (index: number, value: string) => {
    setWords((current) => current.map((word, wordIndex) => wordIndex === index ? value : word));
  };

  const saveWords = () => void onUpdate({ ...session, todaiiVocabulary: words.map((word) => word.trim()).filter(Boolean).slice(0, 5) });

  const reading = (
    <div className={styles.steps}>
      <label className={styles.checkStep}><span><strong>STEP 1</strong> 사전 없이 먼저 읽기</span><input type="checkbox" checked={session.todaiiFirstPassCompleted ?? false} onChange={(event) => void onUpdate({ ...session, todaiiFirstPassCompleted: event.target.checked })} /></label>
      <label className={styles.field}><span><strong>STEP 2</strong> 글의 주제를 한 문장으로 생각하기</span><textarea value={topic} onChange={(event) => setTopic(event.target.value)} onBlur={() => void onUpdate({ ...session, todaiiTopic: topic.trim() || undefined })} /></label>
      <div className={styles.staticStep}><strong>STEP 3</strong><span>모르는 표현 확인</span></div>
      <div className={styles.field}><span><strong>STEP 4</strong> 기억할 단어 최대 3~5개</span><div className={styles.wordGrid}>{words.map((word, index) => <input key={index} aria-label={`기억할 단어 ${index + 1}`} value={word} onChange={(event) => updateWord(index, event.target.value)} onBlur={saveWords} placeholder={`${index + 1}`} />)}</div></div>
      <label className={styles.field}><span><strong>STEP 5</strong> 글 내용 한 줄 요약</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} onBlur={() => void onUpdate({ ...session, todaiiSummary: summary.trim() || undefined })} /></label>
    </div>
  );

  const listening = (
    <div className={styles.steps}>
      <label className={styles.checkStep}><span><strong>STEP 1</strong> 스크립트 없이 듣기</span><input type="checkbox" checked={session.todaiiFirstPassCompleted ?? false} onChange={(event) => void onUpdate({ ...session, todaiiFirstPassCompleted: event.target.checked })} /></label>
      <label className={styles.field}><span><strong>STEP 2</strong> 들린 내용 추측</span><textarea value={guess} onChange={(event) => setGuess(event.target.value)} onBlur={() => void onUpdate({ ...session, todaiiListeningGuess: guess.trim() || undefined })} /></label>
      <label className={styles.checkStep}><span><strong>STEP 3</strong> 스크립트 확인</span><input type="checkbox" checked={session.todaiiScriptChecked ?? false} onChange={(event) => void onUpdate({ ...session, todaiiScriptChecked: event.target.checked })} /></label>
      <label className={styles.checkStep}><span><strong>STEP 4</strong> 다시 듣기</span><input type="checkbox" checked={session.todaiiSecondListenCompleted ?? false} onChange={(event) => void onUpdate({ ...session, todaiiSecondListenCompleted: event.target.checked })} /></label>
      <label className={styles.field}><span><strong>STEP 5</strong> 내용 한 줄 요약</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} onBlur={() => void onUpdate({ ...session, todaiiSummary: summary.trim() || undefined })} /></label>
    </div>
  );

  return (
    <section className={styles.panel} aria-label="Todaii protocol">
      <p className={styles.eyebrow}>TODAII · {todaiiLevelRecommendation(phase)}</p>
      <div className={styles.modeChoices}>
        {(["reading", "listening", "mixed"] as const).map((value) => <Button key={value} variant={mode === value ? "primary" : "secondary"} aria-pressed={mode === value} onClick={() => changeMode(value)}>{value[0].toUpperCase() + value.slice(1)}</Button>)}
      </div>
      {(mode === "reading" || mode === "mixed") && <div><h2>Reading</h2>{reading}</div>}
      {(mode === "listening" || mode === "mixed") && <div><h2>Listening</h2>{listening}</div>}
    </section>
  );
}
