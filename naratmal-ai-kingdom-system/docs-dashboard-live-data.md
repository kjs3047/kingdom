# Dashboard Live Data Adapter Plan

## 목적
대시보드 MVP의 mock 데이터를 왕국 서버의 실제 control plane 응답과 연결하고, 선택 명령 상세를 `/api/kingdom/logs/:id`로 확장한다.

## 현재 연결 방식
- 프론트는 `loadDashboardData()`를 통해 `/api/kingdom/control-plane`를 우선 호출한다.
- 성공 시 `mapControlPlaneToDashboard()`가 control plane 응답을 대시보드 전용 모델로 변환한다.
- 이어서 첫 command id 기준으로 `/api/kingdom/logs/:id`를 호출하여 상세 패널 데이터를 구성한다.
- 실패 시 기존 mock 데이터로 fallback 한다.

## 현재 매핑 범위
- summary metrics
- command flow 목록
- workflow graph의 핵심 노드/엣지
- conversation log 최소 1개 thread
- bottleneck(review pending 기반)
- runtime health 일부
- selected command detail (review history / final message)

## 다음 확장 과제
1. command 클릭 시 동적으로 `/api/kingdom/logs/:id`를 재호출하는 interaction 추가
2. OpenClaw 세션 상태를 `/api/kingdom/openclaw/status`로 읽어 runtime panel과 결합 완료 (1차)
3. workflow graph를 단일 command 기준이 아니라 active command별로 전환 가능하게 개선
4. review history와 action items를 drawer/modal에 연결
