import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { getReviewForPlan, saveReview } from "../db/repository";
import { calculateDayMetrics } from "../domain/metrics";
import { calculateJapaneseCoreCompletion, calculateJapaneseDailySummary } from "../domain/japaneseMetrics";
import type { DailyReview } from "../domain/types";
import { createId } from "../shared/id";
import { useAppStore } from "../store/useAppStore";
import styles from "./ReviewPage.module.css";

export function ReviewPage() {
  const navigate = useNavigate();
  const plan = useAppStore((state) => state.currentPlan);
  const sessions = useAppStore((state) => state.sessions);
  const [existing, setExisting] = useState<DailyReview>();
  const [focusScore, setFocusScore] = useState<DailyReview["focusScore"]>();
  const [japaneseLearned, setJapaneseLearned] = useState("");
  const [graphicsLearned, setGraphicsLearned] = useState("");
  const [finalNextAction, setFinalNextAction] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const metrics = useMemo(() => plan ? calculateDayMetrics(plan, sessions) : undefined, [plan, sessions]);
  const japaneseSummary = useMemo(() => calculateJapaneseDailySummary(sessions), [sessions]);
  const japaneseCoreDone = calculateJapaneseCoreCompletion(plan?.japanesePhase ?? "basic", sessions, plan?.energyLevel ?? "green");

  useEffect(() => {
    if (!plan) return;
    void getReviewForPlan(plan.id).then((review) => {
      setExisting(review);
      setFocusScore(review?.focusScore);
      setJapaneseLearned(review?.japaneseLearned ?? [...sessions].reverse().find((item) => item.yuhadayoExpression || item.japaneseLearned)?.yuhadayoExpression ?? [...sessions].reverse().find((item) => item.japaneseLearned)?.japaneseLearned ?? "");
      setGraphicsLearned(review?.graphicsLearned ?? "");
      setFinalNextAction(review?.finalNextAction ?? [...sessions].reverse().find((item) => item.nextNote)?.nextNote ?? "");
      setSaved(Boolean(review));
    });
  }, [plan, sessions]);

  if (!plan || !metrics) {
    return <section><h1>오늘 리뷰</h1><p>먼저 오늘 계획을 만들어주세요.</p><Button onClick={() => navigate("/today")}>오늘 계획</Button></section>;
  }

  const subjects = [
    { label: "Graphics", included: true, done: sessions.some((item) => item.type === "graphics" && item.status === "completed") },
    { label: "Japanese", included: true, done: japaneseCoreDone },
    { label: "Math", included: plan.supportType === "math", done: sessions.some((item) => item.type === "math" && item.status === "completed") },
    { label: "Certification", included: plan.supportType === "certification", done: sessions.some((item) => item.type === "certification" && item.status === "completed") },
    { label: "Project", included: plan.projectEnabled && plan.energyLevel !== "red", done: sessions.some((item) => item.type === "project" && item.status === "completed") }
  ].filter((item) => item.included);

  const finish = async () => {
    setSaving(true);
    const review: DailyReview = {
      id: existing?.id ?? createId("review"),
      dailyPlanId: plan.id,
      date: plan.date,
      focusScore,
      japaneseLearned: japaneseLearned.trim() || undefined,
      graphicsLearned: graphicsLearned.trim() || undefined,
      finalNextAction: finalNextAction.trim() || undefined,
      ...metrics,
      japaneseSummary,
      createdAt: existing?.createdAt ?? Date.now()
    };
    await saveReview(review);
    setExisting(review);
    setSaved(true);
    setSaving(false);
  };

  return (
    <section>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{metrics.coreCompleted ? "TODAY COMPLETE" : "TODAY REVIEW"}</p>
        <h1 className={styles.success}>{metrics.coreCompleted ? `${plan.energyLevel.toUpperCase()} DAY 완료` : "오늘을 정리합니다"}</h1>
        <p className={styles.subtle}>{plan.energyLevel === "red" ? "최소 루틴을 지킨 것도 온전한 성공입니다." : "시간보다 완료한 블록과 복귀를 봅니다."}</p>
      </header>

      <div className={styles.subjectList}>
        {subjects.map((subject) => <div className={styles.subjectRow} key={subject.label}><span>{subject.label}</span><span className={subject.done ? styles.done : styles.subtle}>{subject.done ? "✓" : "—"}</span></div>)}
      </div>

      <section className={styles.japanesePanel} aria-labelledby="japanese-review-title">
        <h2 id="japanese-review-title">Japanese</h2>
        <div className={styles.japaneseGrid}>
          <span>Anki Review</span><strong>{japaneseSummary.ankiReviewCompleted ? "✓" : "—"}</strong>
          <span>New Vocabulary</span><strong>{japaneseSummary.newVocabularyCount}</strong>
          <span>Grammar</span><strong>{japaneseSummary.newGrammarCount}</strong>
          <span>Yuhadayo</span><strong>{japaneseSummary.yuhadayoCompleted ? "✓" : "—"}</strong>
          <span>Todaii</span><strong>{japaneseSummary.todaiiCompleted ? "✓" : "—"}</strong>
          {japaneseSummary.jlptPracticeCompleted && <><span>JLPT Practice</span><strong>✓</strong></>}
        </div>
        {japaneseSummary.todaiiSummary && <p className={styles.todaiiSummary}><span>Todaii Summary</span>{japaneseSummary.todaiiSummary}</p>}
      </section>

      <div className={styles.metrics}>
        <div className={styles.metric}><strong>{metrics.completedFocusBlocks}</strong><span>Focus blocks</span></div>
        <div className={styles.metric}><strong>{metrics.rescueCount}</strong><span>Rescue</span></div>
        <div className={styles.metric}><strong>{metrics.successfulRescues}</strong><span>Successful</span></div>
        <div className={styles.metric}><strong>{metrics.unplannedExitCount}</strong><span>Unplanned exit</span></div>
        <div className={styles.metric}><strong>{metrics.plannedCompletionRate}%</strong><span>Plan complete</span></div>
      </div>

      <div className={styles.form}>
        <fieldset className={styles.scores}>
          <legend>집중도</legend>
          {[1, 2, 3, 4, 5].map((score) => <label key={score}><input type="radio" name="focusScore" checked={focusScore === score} onChange={() => setFocusScore(score as DailyReview["focusScore"])} />{score}</label>)}
        </fieldset>
        <div className={styles.field}><label htmlFor="review-japanese">오늘 새로 배운 일본어</label><textarea id="review-japanese" className={styles.input} value={japaneseLearned} onChange={(event) => setJapaneseLearned(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="review-graphics">오늘 Graphics 핵심</label><textarea id="review-graphics" className={styles.input} value={graphicsLearned} onChange={(event) => setGraphicsLearned(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="review-next">NEXT</label><textarea id="review-next" className={styles.input} value={finalNextAction} onChange={(event) => setFinalNextAction(event.target.value)} placeholder="다음에 바로 시작할 행동" /></div>
        {saved && <div className={styles.saved} role="status">오늘 리뷰를 저장했습니다.</div>}
        <Button wide disabled={saving} onClick={() => void finish()}>{saving ? "저장 중…" : existing ? "리뷰 업데이트" : "오늘 종료"}</Button>
      </div>
    </section>
  );
}
