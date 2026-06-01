---
name: 지출결의서 에이전트 진행 상황
description: expense-report 서브에이전트 제작 중 - 양식 DRM 해제 대기
type: project
originSessionId: 7abec04b-f468-458d-b44b-124920148d7c
---
`~/.claude/agents/expense-report.md`에 월별 법인카드 영수증을 지출결의서 엑셀에 자동 작성하는 서브에이전트 골격을 만들어둠. 사용자 전역(~/.claude/agents/)에 설치.

양식 파일은 `/Users/lhj/Downloads/법인카드 등 정산서.xlsx`인데 회사 DRM(SCDSA002 헤더, SoftCamp 계열)으로 암호화돼 openpyxl로 못 읽음. 사용자가 회사에서 DRM 해제 후 같은 경로에 재업로드 예정.

**Why:** 양식의 헤더 행 위치, 컬럼명, 데이터 시작 행, 합계 행 위치를 정확히 파악해야 에이전트가 추측 없이 셀에 값을 채울 수 있음. DRM 상태로는 분석 불가.

**How to apply:** 다음 세션에서 사용자가 "양식 다시 올렸다"고 하면 즉시 파일 헤더 바이트 확인(`PK..`로 시작해야 정상 xlsx) → openpyxl로 구조 분석 → expense-report.md의 컬럼 매핑 부분을 양식에 맞게 업데이트. 영수증은 이미지/PDF 형태, 처리 작업은 계정과목 분류·공급가액/부가세 분리·건별 적요·월별 합계.
