# Naratmal Kingdom 실운영 체크리스트

최상위 운영 규칙은 `C:/Users/old-notebook-kjs/.openclaw/workspace/KINGDOM_OPERATING_SYSTEM.md`를, 시스템 운영 기준은 `KINGDOM_SYSTEM_OPERATING_RULES.md`를 따른다.

## 1. 서버 상태
- [ ] `npm run server:status`가 running인지 확인
- [ ] `/health` 응답 확인

## 2. 내부 초안 요청 테스트
- [ ] 일반 내부 요청 1건 전송
- [ ] `deliveryAllowed=true` 확인
- [ ] `reviewStatus=not_required` 확인

## 3. 외부 제출 요청 테스트
- [ ] 외부 제출용 요청 1건 전송
- [ ] `deliveryAllowed=false` 확인
- [ ] `reviewStatus=revision_requested` 확인
- [ ] `revisionSummary` 생성 확인

## 4. 재검수/승인 체인 테스트
- [ ] review decision으로 `revision_requested` 1회 추가
- [ ] `reviewRound` 증가 확인
- [ ] `rootLogId`, `parentLogId`, `reviewHistory` 확인
- [ ] approval 후 `deliveryAllowed=true` 확인

## 5. 메모리 연속성 테스트
- [ ] 같은 requester/sessionKey로 2회 이상 요청
- [ ] 후속 요청 응답에 이전 맥락(memorySummary 기반) 반영 확인

## 6. 운영 제어면 테스트
- [ ] `/api/kingdom/control-plane` 응답 확인
- [ ] 최근 요청 목록 표시 확인
- [ ] pending/approved/blocked 집계 확인

## 7. 빌드/회귀 검증
- [ ] `npm run typecheck:server`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

## 판정 기준
- 위 항목이 모두 통과하면 왕국은 실운영 직전 수준으로 본다.
- 남은 과제는 OpenClaw 실바인딩 자동화와 live 기관 호출 안정화다.
