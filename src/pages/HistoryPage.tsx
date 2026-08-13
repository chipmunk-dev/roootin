import { useEffect, useMemo, useState } from "react";
import { getHistory } from "../db/repository";
import { calculateDayMetrics, rescueSuccessRate } from "../domain/metrics";
import { calculateJapaneseHistoryStats } from "../domain/japaneseMetrics";
import type { DailyPlan, DailyReview, StudySession } from "../domain/types";
import { localDateKey, startOfLocalWeek } from "../shared/date";
import styles from "./HistoryPage.module.css";

const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

function formatStudyTime(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function HistoryPage() {
  const weekStart = useMemo(() => startOfLocalWeek(), []);
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getHistory(localDateKey(weekStart)).then((data) => {
      setPlans(data.plans);
      setSessions(data.sessions);
      setReviews(data.reviews);
      setLoading(false);
    });
  }, [weekStart]);

  const days = dayLabels.map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const key = localDateKey(date);
    const plan = plans.find((item) => item.date === key);
    const daySessions = plan ? sessions.filter((item) => item.dailyPlanId === plan.id) : [];
    const review = reviews.find((item) => item.date === key);
    const metric = plan ? calculateDayMetrics(plan, daySessions) : undefined;
    return { label, key, blocks: review?.completedFocusBlocks ?? metric?.completedFocusBlocks ?? 0 };
  });
  const maxBlocks = Math.max(5, ...days.map((day) => day.blocks));
  const planMetrics = plans.map((plan) => calculateDayMetrics(plan, sessions.filter((session) => session.dailyPlanId === plan.id)));
  const attempts = planMetrics.reduce((sum, metric) => sum + metric.rescueCount, 0);
  const successful = planMetrics.reduce((sum, metric) => sum + metric.successfulRescues, 0);
  const totals = {
    blocks: planMetrics.reduce((sum, metric) => sum + metric.completedFocusBlocks, 0),
    core: planMetrics.filter((metric) => metric.coreCompleted).length,
    attempts,
    successful,
    exits: planMetrics.reduce((sum, metric) => sum + metric.unplannedExitCount, 0),
    study: planMetrics.reduce((sum, metric) => sum + metric.studySeconds, 0),
    plannedRate: planMetrics.length === 0 ? 0 : Math.round(planMetrics.reduce((sum, metric) => sum + metric.plannedCompletionRate, 0) / planMetrics.length)
  };
  const japanese = calculateJapaneseHistoryStats(sessions);

  if (loading) return <p>기록을 불러오는 중…</p>;

  return (
    <section>
      <header className={styles.header}><h1>이번 주</h1><p>산만함보다 돌아온 횟수를 중요하게 봅니다.</p></header>
      {plans.length === 0 ? <div className={styles.empty}>첫 학습 블록을 마치면 여기에 기록됩니다.</div> : (
        <>
          <div className={styles.week} aria-label="이번 주 완료 블록">
            {days.map((day) => <div className={styles.day} key={day.key}><span className={styles.dayLabel}>{day.label}</span><div className={styles.barTrack}><div className={styles.bar} style={{ width: `${(day.blocks / maxBlocks) * 100}%` }} /></div><span className={styles.dayValue}>{day.blocks} blocks</span></div>)}
          </div>
          <div className={styles.metrics}>
            <div className={`${styles.metric} ${styles.primaryMetric}`}><span>Rescue 성공</span><strong>{totals.successful} / {totals.attempts}</strong><div>{rescueSuccessRate(totals.successful, totals.attempts)}%</div></div>
            <div className={styles.metric}><span>Focus Blocks</span><strong>{totals.blocks}</strong></div>
            <div className={styles.metric}><span>Core completion</span><strong>{totals.core}일</strong></div>
            <div className={styles.metric}><span>Plan completion</span><strong>{totals.plannedRate}%</strong></div>
            <div className={styles.metric}><span>Unplanned exit</span><strong>{totals.exits}</strong></div>
            <div className={styles.metric}><span>공부시간</span><strong>{formatStudyTime(totals.study)}</strong></div>
          </div>
          <section className={styles.japaneseSection} aria-labelledby="japanese-history-title">
            <h2 id="japanese-history-title">Japanese</h2>
            <div className={styles.japaneseMetrics}>
              <div><span>Anki Review days</span><strong>{japanese.ankiReviewDays}</strong></div>
              <div><span>New vocabulary</span><strong>{japanese.newVocabularyCount}</strong></div>
              <div><span>Grammar review days</span><strong>{japanese.grammarReviewDays}</strong></div>
              <div><span>Yuhadayo</span><strong>{japanese.yuhadayoSessions}</strong></div>
              <div><span>Todaii</span><strong>{japanese.todaiiSessions}</strong></div>
              <div><span>Reading</span><strong>{japanese.readingSessions}</strong></div>
              <div><span>Listening</span><strong>{japanese.listeningSessions}</strong></div>
              <div><span>JLPT Practice</span><strong>{japanese.jlptPracticeSessions}</strong></div>
              <div><span>Japanese blocks</span><strong>{japanese.japaneseFocusBlocks}</strong></div>
            </div>
            {Object.values(japanese.wrongAnswers).some((count) => count > 0) && <div className={styles.wrongAnswers}><span>오답 누적</span>{Object.entries(japanese.wrongAnswers).filter(([, count]) => count > 0).map(([category, count]) => <strong key={category}>{category} {count}</strong>)}</div>}
          </section>
        </>
      )}
    </section>
  );
}
