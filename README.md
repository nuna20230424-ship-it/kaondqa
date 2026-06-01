# expense-report-agent

월별 법인카드 영수증을 지출결의서 엑셀에 자동 작성하는 Claude Code 서브에이전트 + 진행 메모를 PC 간 동기화하기 위한 저장소.

## 파일 구조

```
agents/
  expense-report.md                       # 서브에이전트 정의
memory/
  project_expense_report_agent.md         # 진행 상황 / 블로커 메모
```

## 다른 PC에서 받아 적용하기

홈 디렉터리 경로 차이에 주의. macOS 기준 `~/.claude/projects/` 아래 디렉터리 이름은 그 PC의 홈 경로를 슬래시 → 하이픈으로 바꾼 형태입니다 (예: `/Users/foo` → `-Users-foo`). Claude Code를 한 번이라도 실행했으면 해당 디렉터리가 자동 생성돼 있습니다.

```bash
git clone https://github.com/nuna20230424-ship-it/kaondqa.git
cd kaondqa

# 1) 서브에이전트 설치
mkdir -p ~/.claude/agents
cp agents/expense-report.md ~/.claude/agents/

# 2) 진행 메모 복원 (디렉터리명은 본인 PC 경로에 맞게)
PROJ_DIR=$(ls -d ~/.claude/projects/-Users-* | head -1)
mkdir -p "$PROJ_DIR/memory"
cp memory/project_expense_report_agent.md "$PROJ_DIR/memory/"

# 3) MEMORY.md 인덱스에 한 줄 추가 (없으면 새로 생성)
echo '- [지출결의서 에이전트 진행 상황](project_expense_report_agent.md) — 양식 DRM 해제 후 재업로드 대기 중, 컬럼 매핑 분석 재개 필요' >> "$PROJ_DIR/memory/MEMORY.md"
```

## 현재 상태 (재개 시 첫 스텝)

- 양식 파일 `법인카드 등 정산서.xlsx`가 회사 DRM(SoftCamp SCDSA002)으로 암호화돼 openpyxl로 못 읽는 상태.
- DRM 해제된 파일을 받으면:
  1. 헤더 바이트가 `PK..`로 시작하는지 확인 (정상 xlsx인지)
  2. openpyxl로 헤더 행 위치 / 컬럼명 / 데이터 시작 행 / 합계 행 분석
  3. `agents/expense-report.md`의 컬럼 매핑 부분을 양식에 맞게 업데이트
- 처리 작업: 계정과목 분류, 공급가액/부가세 분리, 건별 적요 생성, 월별 합계.

## 저장소에 없는 것

- 양식 xlsx 자체 — 회사 DRM이 걸려 있어 다른 PC에서도 못 열기 때문에 제외. DRM 해제본은 각 PC에서 별도로 받아야 함.
- 영수증 이미지/PDF — 개인 자료라 동기화 대상 아님.
