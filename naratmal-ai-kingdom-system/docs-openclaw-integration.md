# OpenClaw Integration Plan

## 현재 상태
- OpenClaw Telegram 채널은 이미 활성화되어 있음
- 별도 Telegram 봇을 새로 설계하는 것보다, 기존 OpenClaw 채널 위에 나랏말 AI 왕국 구조를 올리는 방식이 적합함
- 왕국 브리지: `scripts/telegram-kingdom-bridge.mjs`
- 실바인딩 적용 체크리스트: `openclaw-kingdom-binding.checklist.md`

## 권장 통합 방향
1. 기본 agent는 영의정 역할을 수행하도록 workspace prompt/SOUL.md를 사용
2. 필요 시 `agents.list`에 추가 agent를 정의하여 기관별 분리 확장
3. `bindings`를 통해 특정 채널/토픽을 특정 agent로 연결
4. 메인 Telegram DM 경로는 `main` agent 유지
5. `main` agent는 왕국 서버를 사용할 작업에서 `kingdom:bridge` 경로를 우선 사용

## 현재 openclaw.json 핵심 포인트
- `channels.telegram.enabled = true`
- `channels.telegram.dmPolicy = pairing`
- `channels.telegram.streaming = partial`
- `session.dmScope = per-channel-peer`
- workspace는 `C:\Users\old-notebook-kjs\.openclaw\workspace`

## 운영 권장안
- 외부 제출물/민감 요청: 왕국 브리지 우선 + 검수 게이팅 유지
- 일반 내부 요청: live 기관 호출 허용, timeout/retry/fallback 정책 적용
- 서버 장애 시: `server:status` → `server:stop` → `server:start:detached` 순으로 복구

## 남은 최종 작업
- 실제 OpenClaw 설정 파일에 binding 점검/적용
- DM 실대화 2건(내부/외부) 최종 확인
- 안정화 후 운영 문서 고정
