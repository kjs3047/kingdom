# 반복 멈춤 해결 구조

## 해결 원칙
- 결과 보고 직후 반드시 다음 작업을 checkpoint에 기록한다.
- 다음 작업 기록은 수동 서술이 아니라 `npm run ops:next-task` 같은 실행으로 남긴다.
- checkpoint가 5분 이상 stale이면 실패다.
- 결과 없는 중간 응답보다 checkpoint 갱신과 실제 수정이 우선이다.

## 현재 적용
- `ops:enforce` : current/next/expectedResult/stale 검사
- `ops:next-task` : 다음 작업 강제 기록
