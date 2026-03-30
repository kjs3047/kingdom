# Telegram ↔ Naratmal Kingdom Bridge

## 목표
OpenClaw의 Telegram 메인 세션이 나랏말 AI 왕국 서버(`/api/kingdom/respond`)를 직접 호출하도록 연결한다.

## 현재 구조
- Telegram 채널의 직접 응답 창구는 `main` agent(영의정)
- 왕국 엔진은 `server/index.ts`
- 브리지 스크립트는 `scripts/telegram-kingdom-bridge.mjs`

## 브리지 입력
stdin JSON 예시:

```json
{
  "message": "외부 제출용 1페이지 제안 초안을 작성해줘",
  "sender": "폐하"
}
```

## 브리지 출력
```json
{
  "ok": true,
  "logId": "1774860000000",
  "deliveryAllowed": false,
  "reviewStatus": "revision_requested",
  "workflow": {
    "phase": "review_required",
    "nextAction": "사헌부 권고 반영 후 재검수 필요"
  },
  "revisionSummary": "주관 기관: 승정원 | ...",
  "finalMessage": "영의정 판단: ...",
  "shouldHoldForReview": true
}
```

## 연결 절차
1. `npm run server:start:detached`로 왕국 서버 실행
2. OpenClaw 메인 Telegram binding을 `main` agent에 유지
3. `main` agent가 Telegram DM 수신 시, 필요하면 `exec` 또는 향후 provider hook으로 `node scripts/telegram-kingdom-bridge.mjs`를 호출
4. 반환된 `finalMessage`를 Telegram 원 대화에 회신
5. `shouldHoldForReview=true`이면 검수 대기 안내와 함께 출고 보류

## 권장 후속 구현
- OpenClaw 메시지 핸들러에서 브리지 스크립트를 자동 호출하는 adapter 추가
- 검수 승인 후 원 대화에 자동 회신하는 outbound hook 추가
- requester/session 기준 메모리 연동
