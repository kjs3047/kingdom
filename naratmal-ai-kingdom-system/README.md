# Naratmal AI Kingdom System

실제 동작형 MVP 구조를 담은 프로젝트.

## 포함 내용
- chief_agent 라우팅 로직
- 기관별 mock agent runner
- review_required 정책 반영
- 나랏말 AI 왕국 운영 구조를 시각화하는 React UI

## 실행
```bash
npm install
npm run dev
npm run start:server
```

## 서버 관리 (Windows)
```bash
npm run server:start:detached
npm run server:status
npm run server:stop
```

## 영의정 브리지 CLI
```bash
npm run kingdom:respond -- --message "외부 제출용 1페이지 제안 초안을 작성해줘" --external
npm run kingdom:review -- --log-id <LOG_ID> --status approved --reason "사헌부 승인 완료"
npm run kingdom:bridge -- --message "외부 제출용 1페이지 제안 초안을 작성해줘" --sender "폐하"
```

이 CLI는 OpenClaw 메인 세션이 `exec`로 로컬 왕국 서버를 직접 호출할 때 사용할 수 있다.
Detached 서버(`server:start:detached`)는 기본적으로 `KINGDOM_AGENT_MODE=live`로 떠서 실제 기관 agent를 호출한다.
필요하면 `KINGDOM_LIVE_TIMEOUT_MS`로 live 기관 호출 timeout을 조정할 수 있다.
현재는 응답 안정성을 위해 외부 제출물/민감 요청은 mock 우선 경로로 처리하고, 일반 내부 요청만 live 호출을 시도한다.
테스트 스크립트(`test:e2e`)는 비용 절약을 위해 `mock` 모드로 실행된다.
브리지 스크립트(`kingdom:bridge`)는 Telegram 입력을 왕국 서버 형식으로 정규화해 최종 보고와 검수 보류 여부를 함께 반환한다.

## 타입검사
```bash
npm run typecheck:server
```

## E2E 검증
```bash
npm run test:e2e
```

이 테스트는 요청 → 검수 대기 → 승인 → 출고 가능 전환 흐름을 자동 확인한다.

## 현재 단계
이 버전은 **오케스트레이션 MVP + 로컬 telegram_gateway 서버 뼈대**를 포함한다.
실운영 점검은 `ops-checklist.md`를 기준으로 수행한다.
운영 인계는 `ops-handover.md`, 실바인딩 적용은 `openclaw-kingdom-binding.checklist.md`를 기준으로 본다.
다음 단계:
1. OpenClaw 기존 Telegram 채널 설정에 나랏말 AI 왕국 agent/binding 연결
2. 일반 내부 요청 live 안정화(timeout/retry/fallback)
3. 운영 문서 고정 및 실제 DM 최종 확인
