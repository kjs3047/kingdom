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

## E2E 검증
```bash
npm run test:e2e
```

이 테스트는 요청 → 검수 대기 → 승인 → 출고 가능 전환 흐름을 자동 확인한다.

## 현재 단계
이 버전은 **오케스트레이션 MVP + 로컬 telegram_gateway 서버 뼈대**를 포함한다.
다음 단계:
1. OpenClaw 기존 Telegram 채널 설정에 나랏말 AI 왕국 agent/binding 연결
2. 실제 LLM/provider 호출로 mock runner 교체
3. 세션 메모리 저장 고도화
4. OpenClaw 이벤트/메시지 연동
