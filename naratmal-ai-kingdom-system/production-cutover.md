# Naratmal Kingdom 실운영 전환 절차

최상위 운영 규칙은 `C:/Users/old-notebook-kjs/.openclaw/workspace/KINGDOM_OPERATING_SYSTEM.md`를, 시스템 운영 기준은 `KINGDOM_SYSTEM_OPERATING_RULES.md`를 따른다.

## 1. 사전 준비
- `C:\Users\old-notebook-kjs\.openclaw\openclaw.json` 백업 확인
- 왕국 서버 running 확인: `npm run server:status`
- 최신 빌드 확인: `npm run build`
- 테스트 로그 정리: `npm run logs:cleanup`

## 2. OpenClaw 설정 점검
- Telegram 채널 enabled 확인
- DM scope 확인
- main agent binding 확인
- workspace가 `C:\Users\old-notebook-kjs\.openclaw\workspace`인지 확인

## 3. 운영 전환 직전 검증
- 내부 요청 1건 bridge 확인
- 외부 요청 1건 bridge 확인
- control plane 응답 확인
- 검수 이력 조회 확인

## 4. 전환 후 운영 수칙
- 외부/민감 요청은 검수 게이팅 유지
- 일반 내부 요청 live 호출은 timeout/retry/fallback 정책 하에 운영
- 장애 시 `server:status -> server:stop -> server:start:detached` 순으로 복구

## 5. 전환 완료 기준
- Telegram DM 입력이 왕국 서버 흐름으로 이어짐
- 외부 요청은 검수 보류, 내부 요청은 응답 반환
- control plane과 로그 조회가 정상 동작
