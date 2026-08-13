import { Button } from "../../components/Button";
import { JAPANESE_PHASE_LABELS } from "../../domain/japanesePhase";
import type { JapaneseSettings, StudySession } from "../../domain/types";
import styles from "./JapaneseFocusPanel.module.css";
import { RecallPanel } from "./RecallPanel";
import { TodaiiPanel } from "./TodaiiPanel";
import { JlptPracticePanel } from "./JlptPracticePanel";

interface JapaneseFocusPanelProps {
  session: StudySession;
  settings: JapaneseSettings;
  onUpdate: (session: StudySession) => Promise<void>;
}

export function JapaneseFocusPanel({ session, settings, onUpdate }: JapaneseFocusPanelProps) {
  const phase = session.japanesePhase ?? settings.phase;

  if (session.japaneseMode === "ankiVocabulary" || session.japaneseMode === "ankiGrammar") {
    const grammarOnly = session.japaneseMode === "ankiGrammar";
    return (
      <section className={styles.panel} aria-label="Anki protocol">
        <p className={styles.eyebrow}>REVIEW FIRST</p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <div><strong>Review</strong><small>{grammarOnly ? "Grammar cards" : "Vocabulary / Kanji cards"}</small></div>
            {session.ankiReviewCompleted ? <span className={styles.done}>완료 ✓</span> : <Button variant="secondary" onClick={() => onUpdate({ ...session, ankiReviewCompleted: true })}>Review 완료</Button>}
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <div><strong>New Cards</strong><small>{grammarOnly ? `Grammar target: ${settings.dailyNewGrammarTarget}` : `Vocabulary/Kanji target: ${settings.dailyNewVocabularyTarget}`}</small></div>
          </div>
        </div>
        {phase === "basic" && !settings.ankiGrammarEnabled && <p className={styles.last}>문법 카드는 기초일본어 종료 후 시작합니다.</p>}
      </section>
    );
  }

  if (session.japaneseMode === "yuhadayo") {
    const course = session.yuhadayoCourse || settings.yuhadayoCurrentCourse || "미설정";
    const lesson = session.yuhadayoLesson || settings.yuhadayoCurrentLesson || "미설정";
    return (
      <section className={styles.panel} aria-label="Yuhadayo position">
        <p className={styles.eyebrow}>YUHADAYO</p>
        <div className={styles.position}>
          <div><span>Phase</span><strong>{JAPANESE_PHASE_LABELS[phase]}</strong></div>
          <div><span>Course</span><strong>{course}</strong></div>
          <div><span>Lesson</span><strong>{lesson}</strong></div>
        </div>
        <p className={styles.last}><strong>LAST POSITION</strong><br />{course} · {lesson}</p>
      </section>
    );
  }

  if (session.japaneseMode === "recall") return <RecallPanel session={session} onUpdate={onUpdate} />;

  if (session.japaneseMode === "todaiiReading" || session.japaneseMode === "todaiiListening") {
    return <TodaiiPanel session={session} settings={settings} onUpdate={onUpdate} />;
  }

  if (session.japaneseMode === "jlptPractice") return <JlptPracticePanel session={session} onUpdate={onUpdate} />;

  if (session.japaneseMode === "errorReview") {
    return <section className={styles.panel}><p className={styles.eyebrow}>ERROR REVIEW</p><p className={styles.last}>틀린 이유를 한 가지 찾고, 자료를 닫은 뒤 다시 풉니다.</p></section>;
  }

  return null;
}
