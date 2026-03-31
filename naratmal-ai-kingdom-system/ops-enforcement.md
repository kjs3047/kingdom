# Naratmal Kingdom 운영 강제 규칙

최상위 운영 규칙은 `C:/Users/old-notebook-kjs/.openclaw/workspace/KINGDOM_OPERATING_SYSTEM.md`를, 시스템 운영 기준은 `KINGDOM_SYSTEM_OPERATING_RULES.md`를 따른다.

## 목적
영의정이 "하겠다"고 응답한 뒤 실제 작업 없이 멈추는 일을 방지한다.

## 강제 규칙
1. 응답 후 즉시 첫 tool call 또는 첫 수정이 없으면 실패로 간주한다.
2. 마지막 실행 이후 5분 이상 checkpoint가 갱신되지 않으면 비정상 상태로 본다.
3. `ops-checkpoint.json`에 `currentTask`, `nextTask`, `expectedResult`가 모두 없으면 작업 실패로 본다.
4. 작업 단위 종료 시 다음 1개 작업 단위를 즉시 checkpoint에 기록한다.
5. watchdog이 healthy여도 checkpoint가 stale이면 운영 실패다.

## 운영 기준
- 말보다 tool call
- 설명보다 수정
- 응답보다 결과
- 결과 후 즉시 다음 작업 예약
