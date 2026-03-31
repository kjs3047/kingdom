# HEARTBEAT.md

우선순위 순서대로 점검:
1. 나랏말 AI 왕국에서 현재 `ops-checkpoint.json`의 currentTask가 stale인지 확인
2. stale이면 세션 상태, 서브에이전트 상태, 서버 상태를 직접 점검
3. 필요 시 다음 작업 checkpoint 갱신 또는 복구 조치 수행
4. 폐하께 바로 도움이 되는 변경 사항이 있으면 짧고 공손하게 보고
5. 특별한 이슈가 없으면 HEARTBEAT_OK
