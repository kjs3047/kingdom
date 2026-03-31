# Next.js 14+ App Router 승격 방향

## 목적
현재 Vite + React 기반 대시보드를 향후 운영형 제품으로 승격할 때, Next.js 14+ App Router를 사용해 서버 라우트·SSR·점진적 실데이터 연결을 한 저장소 안에서 정리하기 위한 방향 문서입니다.

## 왜 승격하는가
- 대시보드 UI와 `/api/kingdom/*` 서버 엔드포인트를 같은 프레임에서 관리 가능
- 서버 컴포넌트로 control plane/로그/세션 상태를 초기 렌더에 직접 주입 가능
- App Router의 route handlers로 Express 의존을 점진 축소 가능
- 배포 시 정적 자산 + 서버 경로를 일관되게 운영 가능

## 권장 목표 구조
```text
app/
  layout.tsx
  page.tsx
  api/
    kingdom/
      control-plane/route.ts
      logs/[id]/route.ts
      openclaw/status/route.ts
components/
lib/
  dashboard/
    adapter.ts
    load-dashboard.ts
    openclaw-runtime.ts
server/
  legacy-express/
```

## 단계별 전환안

### 1단계: 화면 계층만 App Router로 이관
- `src/components/*`, `src/dashboard/*`를 `components/`, `lib/dashboard/`로 재배치
- `app/page.tsx`에서 대시보드 셸 렌더
- 클라이언트 상호작용이 필요한 `CommandFlowPanel`만 `use client` 유지
- 현재 스타일은 전역 CSS 또는 CSS Module로 이전

### 2단계: 데이터 로딩을 서버 우선으로 전환
- `loadDashboardData()`를 서버 함수와 클라이언트 보강 함수로 분리
- 초기 렌더는 서버에서 control plane + OpenClaw runtime을 조회
- 선택 명령 클릭 시에는 client fetch 또는 server action으로 상세만 갱신
- 장점: 첫 화면이 mock fallback보다 실데이터에 먼저 붙음

### 3단계: Express API를 Route Handler로 치환
- `/api/kingdom/control-plane` → `app/api/kingdom/control-plane/route.ts`
- `/api/kingdom/logs/[id]` → 동적 route handler
- `/api/kingdom/openclaw/status` → Node runtime route handler
- `respond`, `review/decision`도 순차 이전
- 이 단계부터 `server/index.ts`는 유지보수 모드 또는 제거 대상

### 4단계: 런타임 경계 재정리
- OpenClaw CLI 호출(`openclaw status`, `openclaw gateway status`, `openclaw sessions --json`)은 반드시 Node runtime route에서만 수행
- Edge runtime 사용 금지
- CLI 의존 로직은 `lib/dashboard/openclaw-runtime.ts` 같은 서버 전용 모듈로 격리

### 5단계: 운영 관점 강화
- `revalidate = 0` 또는 명시적 no-store 정책으로 control plane 최신화
- 로그 상세는 부분 스트리밍 또는 suspense 분리
- 장기적으로는 polling 대신 SSE/WebSocket 브리지 고려

## 구체 마이그레이션 체크리스트
- [ ] `src/App.tsx` → `app/page.tsx`
- [ ] `src/main.tsx` 제거 및 Next 엔트리로 전환
- [ ] `vite.config.ts` 제거, `next.config.js` 추가
- [ ] `public/` 자산 재사용 확인
- [ ] Express 전용 `cors`, 별도 서버 시작 스크립트 축소
- [ ] TypeScript path alias 정리 (`@/components`, `@/lib`)
- [ ] build 파이프라인을 `next build` 기준으로 재작성

## 예상 위험
- CLI 호출이 많은 route handler는 응답 지연이 발생할 수 있음
- 서버 컴포넌트/클라이언트 컴포넌트 경계를 잘못 나누면 선택 상태 관리가 번거로워질 수 있음
- 기존 Express 스크립트와 이중 운영 기간 동안 API 중복이 생길 수 있음

## 권장 순서
1. App Router로 UI 셸 이관
2. control plane 읽기 API를 Next route handler로 1개만 먼저 옮김
3. 선택 명령 상세/런타임 상태 API 이전
4. respond/review 쓰기 경로 이전
5. Express 제거

## 결론
이번 대시보드는 이미 `읽기 중심 control plane + 선택 상세 + 런타임 상태 신호` 구조를 갖추었으므로, Next.js 14+ App Router로의 승격 난이도는 높지 않습니다. 가장 안전한 경로는 **읽기 API부터 Route Handler로 점진 치환하고, 쓰기 API는 마지막에 이동**하는 방식입니다.
