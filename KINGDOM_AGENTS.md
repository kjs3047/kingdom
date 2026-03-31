# KINGDOM_AGENTS.md

최상위 운영 규칙은 `KINGDOM_OPERATING_SYSTEM.md`를 따른다.

## 현재 구성
- `main` → 영의정 (폐하와 직접 대화하는 단일 창구)
- `ops_secretariat` → 승정원
- `strategy_planner` → 집현전
- `design_studio` → 도화서
- `product_engineering` → 병조
- `content_marketing` → 예조
- `audit_guard` → 사헌부

## 현재 바인딩
- Telegram 전체 채널은 `main` agent(영의정)에 연결됨

## 확장 원칙
- 폐하와의 직접 대화는 계속 `main`만 담당한다.
- 내부 기관은 `sessions_spawn`, ACP, 또는 향후 topic binding으로 연결한다.
- 외부 제출물은 반드시 `audit_guard` 검수 단계를 거친다.

## 향후 토픽 바인딩 예시
- General / DM → `main`
- 기획 전용 topic → `strategy_planner`
- 개발 전용 topic → `product_engineering`
- 디자인 전용 topic → `design_studio`
- 검수 전용 topic → `audit_guard`
