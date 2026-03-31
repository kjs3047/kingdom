# Naratmal Kingdom 운영 인계 메모

## 지금 가능한 것
- Telegram 브리지 기반 왕국 요청 처리
- 검수/재검수 이력 체인 저장
- requester/sessionKey 기반 메모리 스냅샷
- 운영 제어면 조회(`/api/kingdom/control-plane`)
- 외부/민감 요청 안정 경로(mock 우선)

## 운영자가 볼 것
1. 서버 상태: `npm run server:status`
2. control plane: `/api/kingdom/control-plane`
3. 검수 이력: `/api/kingdom/logs/:id`
4. 실운영 체크리스트: `ops-checklist.md`
5. 실테스트 보고: `ops-test-report.md`

## 아직 남은 리스크
- 일반 내부 요청의 live 응답 시간 변동
- OpenClaw 메인 흐름에 대한 완전 자동 연결은 실제 설정 반영이 필요

## 권장 운영 순서
1. 서버 running 확인
2. 내부 요청 1건 확인
3. 외부 요청 1건 확인
4. control plane 집계 확인
5. 이상 시 server restart 및 bridge 재검증
