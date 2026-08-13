import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { SessionCard } from "../components/SessionCard";
import { japaneseTodaySummary } from "../domain/japanesePhase";
import type { EnergyLevel, JapaneseWeakness, SupportType } from "../domain/types";
import { formatLongDate, localDateKey } from "../shared/date";
import { useAppStore } from "../store/useAppStore";
import styles from "./TodayPage.module.css";

const energyChoices: Array<{ value: EnergyLevel; title: string; description: string }> = [
  { value: "green", title: "GREEN", description: "깊게 몰입할 여유가 있습니다." },
  { value: "yellow", title: "YELLOW", description: "핵심을 지키고 선택 블록은 가볍게 둡니다." },
  { value: "red", title: "RED", description: "최소 루틴으로 흐름을 이어갑니다." }
];

const supportChoices: Array<{ value: SupportType; title: string; description: string }> = [
  { value: "math", title: "Math", description: "Math 다음에 Graphics Apply가 이어집니다." },
  { value: "japaneseWeakness", title: "Japanese Weakness", description: "어휘·문법·독해·청해 중 하나를 보강합니다." },
  { value: "certification", title: "Certification", description: "30~40분 자격증 블록을 둡니다." },
  { value: "none", title: "None", description: "오늘은 두 핵심 과목에 집중합니다." }
];

function Onboarding() {
  const createDailyPlan = useAppStore((state) => state.createDailyPlan);
  const [step, setStep] = useState(1);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("green");
  const [graphicsGoal, setGraphicsGoal] = useState("");
  const [japaneseGoal, setJapaneseGoal] = useState("");
  const [supportType, setSupportType] = useState<SupportType>("math");
  const [supportGoal, setSupportGoal] = useState("");
  const [japaneseWeakness, setJapaneseWeakness] = useState<JapaneseWeakness>("vocabulary");
  const [projectEnabled, setProjectEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    await createDailyPlan({
      energyLevel,
      graphicsGoal: graphicsGoal.trim() || "오늘의 Graphics 한 단계",
      japaneseGoal: japaneseGoal.trim() || "일본어 최소 한 가지 익히기",
      supportType,
      supportGoal: supportGoal.trim() || undefined,
      japaneseWeakness: supportType === "japaneseWeakness" ? japaneseWeakness : undefined,
      projectEnabled: energyLevel !== "red" && projectEnabled
    });
    setSaving(false);
  };

  return (
    <section className={styles.onboarding} aria-labelledby="onboarding-title">
      <div className={styles.progress} aria-label={`${step} / 4 단계`}>
        {[1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? styles.active : ""} />)}
      </div>
      {step === 1 && (
        <>
          <p className={styles.eyebrow}>오늘 시작</p>
          <h1 id="onboarding-title" className={styles.prompt}>오늘 컨디션은?</h1>
          <div className={styles.choices}>
            {energyChoices.map((choice) => (
              <button key={choice.value} aria-pressed={energyLevel === choice.value} className={`${styles.choice} ${energyLevel === choice.value ? styles.selected : ""}`} onClick={() => setEnergyLevel(choice.value)}>
                <strong>{choice.title}</strong><span>{choice.description}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <p className={styles.eyebrow}>Graphics</p>
          <h1 className={styles.prompt}>오늘 끝낼 한 가지</h1>
          <div className={styles.field}>
            <label htmlFor="graphics-goal">Graphics 목표</label>
            <input id="graphics-goal" className={styles.input} autoFocus value={graphicsGoal} onChange={(event) => setGraphicsGoal(event.target.value)} placeholder="예: View Matrix 직접 구현" />
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <p className={styles.eyebrow}>Japanese</p>
          <h1 className={styles.prompt}>오늘 배울 범위</h1>
          <div className={styles.field}>
            <label htmlFor="japanese-goal">Japanese 목표</label>
            <input id="japanese-goal" className={styles.input} autoFocus value={japaneseGoal} onChange={(event) => setJapaneseGoal(event.target.value)} placeholder="예: 유하다요 22강" />
          </div>
        </>
      )}
      {step === 4 && (
        <>
          <p className={styles.eyebrow}>Support</p>
          <h1 className={styles.prompt}>보조 과목을 정합니다</h1>
          <div className={styles.choices}>
            {supportChoices.map((choice) => (
              <button key={choice.value} aria-pressed={supportType === choice.value} className={`${styles.choice} ${supportType === choice.value ? styles.selected : ""}`} onClick={() => setSupportType(choice.value)}>
                <strong>{choice.title}</strong><span>{choice.description}</span>
              </button>
            ))}
          </div>
          {supportType !== "none" && (
            <div className={styles.field} style={{ marginTop: "1rem" }}>
              <label htmlFor="support-goal">Support 목표 <span className="muted">(선택)</span></label>
              <input id="support-goal" className={styles.input} value={supportGoal} onChange={(event) => setSupportGoal(event.target.value)} placeholder={supportType === "math" ? "예: 행렬 곱셈 순서" : supportType === "japaneseWeakness" ? "예: 조사 구분" : "예: 기출 1회"} />
            </div>
          )}
          {supportType === "japaneseWeakness" && (
            <div className={styles.weaknessChoices} aria-label="Japanese weakness">
              {(["vocabulary", "grammar", "reading", "listening"] as const).map((weakness) => <label key={weakness}><input type="radio" name="japanese-weakness" checked={japaneseWeakness === weakness} onChange={() => setJapaneseWeakness(weakness)} /> {weakness}</label>)}
            </div>
          )}
          {energyLevel !== "red" && (
            <label className={styles.checkRow}><input type="checkbox" checked={projectEnabled} onChange={(event) => setProjectEnabled(event.target.checked)} /> Project 블록 포함</label>
          )}
        </>
      )}
      <div className={styles.stepActions}>
        {step > 1 && <Button variant="quiet" onClick={() => setStep((value) => value - 1)}>이전</Button>}
        {step < 4 ? (
          <Button onClick={() => setStep((value) => value + 1)}>다음</Button>
        ) : (
          <Button onClick={() => void finish()} disabled={saving}>{saving ? "만드는 중…" : "오늘 계획 만들기"}</Button>
        )}
      </div>
    </section>
  );
}

export function TodayPage() {
  const navigate = useNavigate();
  const initialized = useAppStore((state) => state.initialized);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const plan = useAppStore((state) => state.currentPlan);
  const sessions = useAppStore((state) => state.sessions);
  const japaneseSettings = useAppStore((state) => state.settings.japanese);
  const runningSession = useAppStore((state) => state.runningSession);
  const updateDuration = useAppStore((state) => state.updateDuration);
  const startSession = useAppStore((state) => state.startSession);

  if (!initialized || loading) return <p>오늘 계획을 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;
  if ((!plan || plan.date !== localDateKey()) && runningSession) {
    return <section><p className={styles.eyebrow}>진행 중인 세션</p><h1>{runningSession.title}</h1><p className={styles.date}>자정이 지나도 이 세션은 시작한 계획에 남습니다.</p><Button onClick={() => navigate(`/focus/${runningSession.id}`)}>세션 복구</Button></section>;
  }
  if (!plan || plan.date !== localDateKey()) return <Onboarding />;

  const nextSession = sessions.find((session) => session.status === "pending" || session.status === "paused");
  const supportLabel = plan.supportType === "none" ? "None" : plan.supportType === "math" ? "Math" : plan.supportType === "japaneseWeakness" ? `Japanese · ${plan.japaneseWeakness ?? "Weakness"}` : "Certification";

  const begin = async () => {
    if (runningSession) {
      navigate(`/focus/${runningSession.id}`);
      return;
    }
    if (!nextSession) {
      navigate("/review");
      return;
    }
    await startSession(nextSession.id);
    navigate(`/focus/${nextSession.id}`);
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>{plan.energyLevel.toUpperCase()} DAY</p>
        <h1>오늘의 흐름</h1>
        <p className={styles.date}>{formatLongDate(plan.date)}</p>
      </header>

      {runningSession && (
        <aside className={styles.recovery}>
          <strong>{runningSession.title} 진행 중</strong>
          <p>시작한 계획에 그대로 이어집니다.</p>
          <Button onClick={() => navigate(`/focus/${runningSession.id}`)}>세션으로 돌아가기</Button>
        </aside>
      )}

      <div className={styles.planSummary}>
        <section className={styles.goalCard}><h2>Graphics</h2><p>{plan.graphicsGoal}</p></section>
        <section className={styles.goalCard}><h2>Japanese</h2><p>{japaneseTodaySummary({ ...japaneseSettings, phase: plan.japanesePhase ?? japaneseSettings.phase })}</p></section>
        <section className={styles.goalCard}><h2>Support</h2><p>{supportLabel}{plan.supportGoal ? ` · ${plan.supportGoal}` : ""}</p></section>
      </div>

      <h2 className={styles.sectionTitle}>Today</h2>
      <div className={styles.queue}>
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} onDurationChange={(minutes) => void updateDuration(session.id, minutes)} />
        ))}
        <div className={styles.reviewRow}><span>{sessions.length + 1}</span><strong>Daily Review</strong><span>마무리</span></div>
      </div>

      <div className={styles.actions}>
        <Button onClick={() => void begin()}>{nextSession || runningSession ? "START" : "오늘 리뷰"}</Button>
      </div>
    </>
  );
}
