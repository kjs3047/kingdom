# OpenClaw Integration Plan

## 현재 상태
- OpenClaw Telegram 채널은 이미 활성화되어 있음
- 별도 Telegram 봇을 새로 설계하는 것보다, 기존 OpenClaw 채널 위에 나랏말 AI 왕국 구조를 올리는 방식이 적합함

## 권장 통합 방향
1. 기본 agent는 영의정 역할을 수행하도록 workspace prompt/SOUL.md를 사용
2. 필요 시 `agents.list`에 추가 agent를 정의하여 기관별 분리 확장
3. `bindings`를 통해 특정 채널/토픽을 특정 agent로 연결
4. topic 기반 또는 ACP 기반 확장 시 기관별 세션을 분리

## 현재 openclaw.json 핵심 포인트
- `channels.telegram.enabled = true`
- `channels.telegram.dmPolicy = pairing`
- `channels.telegram.streaming = partial`
- `session.dmScope = per-channel-peer`
- workspace는 `C:\Users\old-notebook-kjs\.openclaw\workspace`

## 다음 실제 작업
- openclaw.json 백업
- agents.list / identity / bindings 설계
- 나랏말 AI 왕국용 agent 설정 추가
- 필요 시 Telegram topic 또는 별도 binding 전략 추가
