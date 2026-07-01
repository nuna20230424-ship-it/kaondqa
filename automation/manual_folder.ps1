# 수동 실행: 원하는 월(YY.MM) 폴더 + 영수증 폴더 + 전월 지출결의서 양식 생성 (monthly_folder.ps1 재사용)
param(
    [string]$Month = ''   # 예: '26.08'. 비우면 실행 시 직접 물어봄
)
$ErrorActionPreference = 'Stop'

# 같은 폴더의 자동 스크립트(monthly_folder.ps1)를 그대로 호출한다
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$worker = Join-Path $here 'monthly_folder.ps1'
if (-not (Test-Path -LiteralPath $worker)) {
    Write-Host "monthly_folder.ps1 을 찾을 수 없습니다: $worker" -ForegroundColor Red
    exit 1
}

# 월 입력 (파라미터로 안 주면 물어본다. 엔터 치면 이번 달)
if (-not $Month) {
    $default = (Get-Date).ToString('yy.MM')
    $inp = Read-Host "생성할 폴더 월을 YY.MM 로 입력하세요 (엔터 = 이번 달 $default)"
    if ($inp) { $Month = $inp } else { $Month = $default }
}

# 형식 검증
if ($Month -notmatch '^\d{2}\.\d{2}$') {
    Write-Host "형식이 올바르지 않습니다. 'YY.MM' 형태로 입력하세요 (예: 26.08)." -ForegroundColor Red
    exit 1
}
$yy = [int]$Month.Substring(0,2)
$mm = [int]$Month.Substring(3,2)
if ($mm -lt 1 -or $mm -gt 12) {
    Write-Host "월(MM)은 01~12 범위여야 합니다." -ForegroundColor Red
    exit 1
}

# YY.MM 의 1일을 기준일로 삼아 자동 스크립트 호출 (양식은 자동으로 전월분이 붙는다)
$refDate = Get-Date -Year (2000 + $yy) -Month $mm -Day 1 -Hour 0 -Minute 0 -Second 0
Write-Host "대상 폴더 월 = $Month  (정산서 양식은 전월분으로 생성됩니다)." -ForegroundColor Cyan

& $worker -RefDate $refDate

Write-Host "수동 생성 완료." -ForegroundColor Green
