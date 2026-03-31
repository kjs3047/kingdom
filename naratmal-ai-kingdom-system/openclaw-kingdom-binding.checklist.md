# OpenClaw 실바인딩 적용 체크리스트

## 목표
OpenClaw 메인 Telegram 세션이 나랏말 AI 왕국 브리지를 기본 경로로 타도록 운영 구성을 마감한다.

## 적용 절차
1. `openclaw.json` 백업
2. `channels.telegram.enabled=true` 확인
3. `session.dmScope=per-channel-peer` 유지 확인
4. `agents.list`에 필요한 기관 agent 정의 확인
5. Telegram 기본 binding이 `main` agent를 타도록 확인
6. `main` agent가 필요 시 `scripts/telegram-kingdom-bridge.mjs`를 호출하도록 운영 규칙 반영
7. 왕국 서버(`npm run server:start:detached`) running 확인
8. DM에서 내부 요청/외부 요청 각각 1건 실검증

## 완료 기준
- Telegram DM 요청이 영의정 → 왕국 브리지 → 검수/로그/메모리 흐름으로 이어진다.
- 외부 요청은 검수 보류가 걸리고, 내부 요청은 응답이 돌아온다.
