# expense-report-agent

월별 법인카드 영수증을 `법인카드 등 정산서` 엑셀에 자동 작성하는 Claude Code 에이전트·스킬 모음 + 진행 메모 동기화 저장소.

## 파일 구조

```
agents/
  expense-report.md                       # 지출결의서 작성 서브에이전트
  receipt-rename.md                        # 영수증 파일명 정리 서브에이전트
.claude/skills/
  corpcard-expense/
    SKILL.md                              # 통합 워크플로 스킬 (/corpcard-expense)
    scripts/                              # 매월 폴더 자동생성 스크립트 동봉
automation/
  monthly_folder.ps1                       # 매월 1일 정산 폴더 생성(멱등)
  install_task.ps1                         # 작업 스케줄러 등록
  README.md
memory/
  project_expense_report_agent.md          # 진행 상황 메모
```

## 스킬 사용법 (`/corpcard-expense`)

영수증 정리 → 지출결의서 작성 → (선택) 월폴더 자동화를 한 번에 처리하는 스킬.

```bash
git clone https://github.com/nuna20230424-ship-it/kaondqa.git
cd kaondqa
# 이 폴더에서 Claude Code를 실행하면 .claude/skills/ 의 스킬이 자동 인식됨
```

- 전역으로 쓰려면 스킬 폴더를 홈에 복사: `cp -r .claude/skills/corpcard-expense ~/.claude/skills/`
- Claude Code에서 `/corpcard-expense` 호출 후, 묻는 대로 입력값을 제공한다.
  1. 영수증 폴더 경로
  2. 양식(`법인카드 등 정산서`) 파일 경로
  3. 파일명 접두사 — 파트·명목에 맞게 (예: `개발QA파트_업무활동비_`)
  4. 대상 월 / 출력 경로(선택)
- 결과: 정리된 영수증 파일명 + 채워진 지출결의서(`*_작성본.xlsx`) + 계정과목별 요약 보고.

자세한 컬럼 매핑·금액 판독·계정 분류 규칙은 `.claude/skills/corpcard-expense/SKILL.md` 참고.

## 서브에이전트만 쓰기

스킬 대신 개별 에이전트로도 쓸 수 있다.

```bash
mkdir -p ~/.claude/agents
cp agents/expense-report.md agents/receipt-rename.md ~/.claude/agents/
```

## 매월 정산 폴더 자동생성 (선택)

`automation/`(또는 스킬의 `scripts/`) 스크립트로 매월 1일 폴더를 자동 생성한다.

1. `monthly_folder.ps1`·`install_task.ps1`의 `BaseDir`·`Master`·양식 접두사를 본인 환경에 맞게 수정
2. 빈 양식을 `Master` 경로에 둔다
3. `install_task.ps1` 실행 → 작업 스케줄러에 매월 1일 09:00 등록

> PowerShell 5.1은 `.ps1`을 **UTF-8 BOM**으로 저장해야 한글이 깨지지 않는다(BOM 없으면 파싱 오류).

## 저장소에 없는 것

- 양식 xlsx·영수증 이미지/PDF — 회사 자료·개인정보라 동기화 대상 아님. 각 PC에서 별도로 둔다.
