# 매달 1일 실행: 실행월 폴더(YY.MM) + 영수증 폴더 + 전월 지출결의서 양식 복사 (멱등)
param(
    [datetime]$RefDate = (Get-Date),
    [string]$BaseDir = 'D:\01. Work\001. 개발파트 QA\0000. 공통\003. 법인카드',
    [string]$Master  = 'D:\01. Work\001. 개발파트 QA\0000. 공통\003. 법인카드\_양식\법인카드 등 정산서_양식.xlsx'
)
$ErrorActionPreference = 'Stop'

# 실행월 폴더 / 영수증 폴더
$folderName = $RefDate.ToString('yy.MM')               # 예: 26.07
$monthDir   = Join-Path $BaseDir $folderName
$receiptDir = Join-Path $monthDir '영수증'

# 전월(=사용월) 양식 파일명
$prev    = $RefDate.AddMonths(-1)
$prevYY  = $prev.ToString('yy')                        # 예: 26
$prevM   = [int]$prev.ToString('%M')                   # 앞 0 제거: 6
$formName = "법인카드 등 정산서_${prevYY}년 ${prevM}월_개발QA파트.xlsx"
$formPath = Join-Path $monthDir $formName

# 로그 준비
$logDir = Join-Path $BaseDir '_자동화'
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir 'monthly_folder.log'
function Log($m) {
    $line = "{0}  (기준일 {1})  {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $RefDate.ToString('yyyy-MM-dd'), $m
    $line | Tee-Object -FilePath $logFile -Append
}

# 1) 월 폴더
if (Test-Path -LiteralPath $monthDir) { Log "[유지] 폴더 존재: $folderName" }
else { New-Item -ItemType Directory -Path $monthDir -Force | Out-Null; Log "[생성] 폴더: $folderName" }

# 2) 영수증 폴더
if (Test-Path -LiteralPath $receiptDir) { Log "[유지] 영수증 폴더 존재" }
else { New-Item -ItemType Directory -Path $receiptDir -Force | Out-Null; Log "[생성] 영수증 폴더" }

# 3) 양식 복사 (이미 있으면 덮어쓰지 않음)
if (Test-Path -LiteralPath $formPath) {
    Log "[유지] 양식 존재: $formName"
} elseif (-not (Test-Path -LiteralPath $Master)) {
    Log "[오류] 마스터 양식 없음: $Master"
} else {
    Copy-Item -LiteralPath $Master -Destination $formPath
    Log "[생성] 양식 복사: $formName"
}
Log "완료: $monthDir"
