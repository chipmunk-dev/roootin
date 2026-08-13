import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import type { AnkiLoad, JapaneseSettings, JlptWrongCategory, StudySession } from "../../domain/types";
import styles from "./JapaneseCompletionModal.module.css";

interface JapaneseCompletionModalProps {
  session: StudySession;
  settings: JapaneseSettings;
  needsReproduction: boolean;
  onCancel: () => void;
  onComplete: (patch: Partial<StudySession>) => void;
}

export function JapaneseCompletionModal({ session, settings, needsReproduction, onCancel, onComplete }: JapaneseCompletionModalProps) {
  const [ankiLoad, setAnkiLoad] = useState<AnkiLoad | undefined>(session.ankiLoad);
  const [newVocabularyCount, setNewVocabularyCount] = useState(session.newVocabularyCount ?? 0);
  const [newGrammarCount, setNewGrammarCount] = useState(session.newGrammarCount ?? 0);
  const [course, setCourse] = useState(session.yuhadayoCourse ?? settings.yuhadayoCurrentCourse ?? "");
  const [lesson, setLesson] = useState(session.yuhadayoLesson ?? settings.yuhadayoCurrentLesson ?? "");
  const [expression, setExpression] = useState(session.yuhadayoExpression ?? "");
  const [example, setExample] = useState(session.yuhadayoExample ?? "");
  const [todaiiSummary, setTodaiiSummary] = useState(session.todaiiSummary ?? "");
  const [wrongCategories, setWrongCategories] = useState<JlptWrongCategory[]>(session.jlptWrongCategories ?? []);
  const [wrongNote, setWrongNote] = useState(session.jlptWrongNote ?? "");
  const [helpReproduced, setHelpReproduced] = useState(session.helpReproduced ?? false);
  const isAnki = session.japaneseMode === "ankiVocabulary" || session.japaneseMode === "ankiGrammar";
  const isYuhadayo = session.japaneseMode === "yuhadayo";
  const isTodaii = session.japaneseMode === "todaiiReading" || session.japaneseMode === "todaiiListening";
  const isJlpt = session.japaneseMode === "jlptPractice";
  const title = isAnki
    ? "Anki 마무리"
    : isYuhadayo
      ? "Yuhadayo 마무리"
      : isTodaii
        ? "Todaii 마무리"
        : isJlpt
          ? "JLPT Practice 마무리"
          : session.japaneseMode === "recall"
            ? "Recall 마무리"
            : "Japanese 블록 마무리";

  const finish = () => {
    onComplete({
      ankiLoad,
      newVocabularyCount: session.japaneseMode === "ankiVocabulary" ? newVocabularyCount : session.newVocabularyCount,
      newGrammarCount: session.japaneseMode === "ankiGrammar" ? newGrammarCount : session.newGrammarCount,
      yuhadayoCourse: isYuhadayo ? course.trim() || undefined : session.yuhadayoCourse,
      yuhadayoLesson: isYuhadayo ? lesson.trim() || undefined : session.yuhadayoLesson,
      yuhadayoExpression: isYuhadayo ? expression.trim() || undefined : session.yuhadayoExpression,
      yuhadayoExample: isYuhadayo ? example.trim() || undefined : session.yuhadayoExample,
      japaneseLearned: isYuhadayo ? expression.trim() || undefined : session.japaneseLearned,
      todaiiSummary: isTodaii ? todaiiSummary.trim() || undefined : session.todaiiSummary,
      jlptWrongCategories: isJlpt ? wrongCategories : session.jlptWrongCategories,
      jlptWrongNote: session.japaneseMode === "jlptPractice" || session.japaneseMode === "errorReview" ? wrongNote.trim() || undefined : session.jlptWrongNote,
      helpReproduced
    });
  };

  return (
    <Modal title={title} onClose={onCancel}>
      <div className={styles.form}>
        {isAnki && (
          <>
            <div className={styles.field}><strong>Review Load</strong><div className={styles.radioGroup}>{(["easy", "normal", "heavy"] as const).map((load) => <label key={load}><input type="radio" name="anki-load" checked={ankiLoad === load} onChange={() => setAnkiLoad(load)} />{load[0].toUpperCase() + load.slice(1)}</label>)}</div></div>
            {session.japaneseMode === "ankiVocabulary" ? <label className={styles.field}><strong>오늘 진행한 새 Vocabulary/Kanji</strong><input className={styles.input} type="number" min="0" max="200" value={newVocabularyCount} onChange={(event) => setNewVocabularyCount(Math.max(0, Number(event.target.value)))} /></label> : <label className={styles.field}><strong>오늘 진행한 새 Grammar</strong><input className={styles.input} type="number" min="0" max="100" value={newGrammarCount} onChange={(event) => setNewGrammarCount(Math.max(0, Number(event.target.value)))} /></label>}
            <p className={styles.hint}>Heavy 기록은 다음 목표 조정용 analytics로만 저장합니다.</p>
          </>
        )}
        {isYuhadayo && (
          <>
            <div className={styles.twoColumns}><label className={styles.field}><strong>Current Course</strong><input className={styles.input} value={course} onChange={(event) => setCourse(event.target.value)} /></label><label className={styles.field}><strong>Current Lesson</strong><input className={styles.input} value={lesson} onChange={(event) => setLesson(event.target.value)} /></label></div>
            <label className={styles.field}><strong>오늘 새로 배운 문법/표현</strong><textarea className={styles.input} value={expression} onChange={(event) => setExpression(event.target.value)} /></label>
            <label className={styles.field}><strong>직접 예문</strong><textarea className={styles.input} value={example} onChange={(event) => setExample(event.target.value)} /></label>
          </>
        )}
        {session.japaneseMode === "recall" && <p className={styles.hint}>기억난 것 1~2개만 남겼다면 충분합니다.</p>}
        {isTodaii && <label className={styles.field}><strong>한 줄 요약</strong><textarea className={styles.input} value={todaiiSummary} onChange={(event) => setTodaiiSummary(event.target.value)} placeholder="비워 두어도 완료할 수 있습니다." /></label>}
        {isJlpt && (
          <div className={styles.field}>
            <strong>Wrong Answer Categories</strong>
            <div className={styles.radioGroup}>{(["vocabulary", "kanji", "grammar", "reading", "listening"] as const).map((category) => <label key={category}><input type="checkbox" checked={wrongCategories.includes(category)} onChange={(event) => setWrongCategories((current) => event.target.checked ? [...current, category] : current.filter((item) => item !== category))} />{category[0].toUpperCase() + category.slice(1)}</label>)}</div>
          </div>
        )}
        {(isJlpt || session.japaneseMode === "errorReview") && <label className={styles.field}><strong>오답 메모</strong><textarea className={styles.input} value={wrongNote} onChange={(event) => setWrongNote(event.target.value)} placeholder="선택 입력" /></label>}
        {needsReproduction && <label><input type="checkbox" checked={helpReproduced} onChange={(event) => setHelpReproduced(event.target.checked)} /> 도움받은 내용을 직접 다시 구현/풀이함</label>}
      </div>
      <div className={styles.actions}><Button variant="secondary" onClick={onCancel}>조금 더 하기</Button><Button onClick={finish}>완료</Button></div>
    </Modal>
  );
}
