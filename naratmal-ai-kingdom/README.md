# Naratmal AI Kingdom

나랏말 AI 왕국의 **실행 가능한 MVP 프런트엔드 초안**입니다.

## 포함 내용
- 영의정(`chief_agent`) 중심 단일 창구형 구조 설명
- 핵심 기관 7종 정의
- 기관 라우팅 규칙 및 대표 시나리오
- MVP 구현 순서
- 시스템 프롬프트 초안
- 향후 독립 에이전트 확장 전략

## 실행 방법
```bash
npm install
npm run dev
```

## 현재 상태
이 버전은 제품 설계와 운영 규칙을 시각화하는 **프런트엔드 MVP**입니다.
다음 단계로는 아래 작업이 이어져야 합니다.

1. `telegram_gateway` 서버 구축
2. `chief_agent` 라우터 구현
3. 기관별 prompt / schema / workflow 엔진 구현
4. `audit_guard` 검수 플래그 도입
5. 세션 메모리 및 작업 로그 저장

## 추천 후속 폴더 구조
```text
naratmal-ai-kingdom/
├─ apps/
│  └─ telegram_gateway/
├─ agents/
│  ├─ chief_agent/
│  ├─ ops_secretariat/
│  ├─ strategy_planner/
│  ├─ design_studio/
│  ├─ product_engineering/
│  ├─ content_marketing/
│  └─ audit_guard/
├─ orchestrator/
├─ prompts/
├─ schemas/
├─ memory/
└─ policies/
```
