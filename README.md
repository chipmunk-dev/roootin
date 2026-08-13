# FocusFlow

FocusFlow는 계획된 학습 전환과 빠른 집중 복귀를 돕는 로컬 우선 Study PWA입니다. 단순 카운트다운이 아니라 Green / Yellow / Red 루틴, 복구 가능한 세션 타이머, Distractor Inbox와 3분 Rescue, NEXT, 일일 리뷰를 하나의 흐름으로 연결합니다.

Japanese Core는 JLPT N3 준비 단계를 지원합니다. Settings에서 Basic, Level Up, N3, N3 Exam Preparation을 수동 선택하며, 이 선택은 날짜 기반 추정보다 항상 우선합니다. 새 계획에는 당시 phase가 snapshot으로 저장됩니다.

## 실행

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

## 데이터와 오프라인

계획, 세션, 산만함, 막힌 지점, 리뷰, 설정은 브라우저 IndexedDB의 `focus-flow` 데이터베이스에 저장됩니다. 계정이나 서버는 사용하지 않습니다. production build는 Workbox 기반 service worker와 Web App Manifest를 생성하며, 한 번 불러온 앱 shell은 오프라인에서도 실행됩니다.

데이터베이스 v2 migration은 기존 table과 key를 유지한 채 `settings.japanese` 기본값만 추가합니다. 기존 Japanese session은 `japaneseMode`가 없는 legacy session으로 계속 읽히며 기존 plan/session/review를 삭제하거나 재작성하지 않습니다.

## 타이머

타이머는 callback 횟수를 세지 않습니다. 세션 시작 시 `startedAt`과 `expectedEndAt`을 저장하고, 화면에는 현재 시각과 종료 시각의 차이를 표시합니다. pause 동안은 종료 시각을 멈춘 시간만큼 옮깁니다. 따라서 background throttling, 새로고침, 탭 종료 후 재실행, 자정 통과 뒤에도 시작한 DailyPlan에 속한 세션을 복구할 수 있습니다.

## 구조

- `src/domain`: 루틴, clock 타이머, 성공/KPI 계산 순수 함수와 타입
- `src/domain/japaneseRoutineEngine.ts`: phase별 Japanese 세션 생성 및 JLPT preset
- `src/domain/japaneseMetrics.ts`: Japanese Core 판정과 주간 통계
- `src/db`: Dexie 스키마와 저장소
- `src/store`: 세션 상태 전이와 IndexedDB 동기화
- `src/features/japanese`: Anki, Yuhadayo, Recall, Todaii, JLPT Practice UI
- `src/pages`: Today, Focus, Review, History, Settings
- `src/hooks`: visibility, wake lock, 알림음/notification
- `src/components`: 공용 접근성 UI

앱 이름은 `src/config/app.ts`의 `APP_NAME`에서 변경합니다.
