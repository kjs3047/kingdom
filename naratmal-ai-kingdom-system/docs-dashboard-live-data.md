# Dashboard Live Data Adapter Plan

## 목적
대시보드 MVP의 mock 데이터를 왕국 서버의 실제 control plane 응답과 연결한다.

## 현재 연결 방식
- 프론트는 `loadDashboardData()`를 통해 `/api/kingdom/control-plane`를 우선 호출한다.
- 성공 시 `mapControlPlaneToDashboard()`가 control plane 응답을 대시보드 전용 모델로 변환한다.
- 실패 시 기존 mock 데이터로 fallback 한다.

## 현재 매핑 범위
- summary metrics
- command flow 목록
- workflow graph의 핵심 노드/엣지
- conversation log 최소 1개 thread
- bottleneck(review pending 기반)
- runtime health 일부

## 다음 확장 과제
1. `/api/kingdom/logs/:id`와 연동해 대화/기관 작업 이력 상세화
2. OpenClaw 세션 상태를 별도 API로 노출해 dashboard runtime panel과 결합
3. workflow graph를 단일 command 기준이 아니라 active command별로 전환 가능하게 개선
4. review history와 action items를 drawer에 연결
