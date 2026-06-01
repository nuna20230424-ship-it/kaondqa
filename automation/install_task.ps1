# 작업 스케줄러에 '법인카드 월폴더 자동생성' 작업을 매월 1일 09:00 실행으로 등록
$taskName = '법인카드 월폴더 자동생성'
$script   = 'D:\01. Work\001. 개발파트 QA\0000. 공통\003. 법인카드\_자동화\monthly_folder.ps1'

$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>매월 1일 실행월 폴더(YY.MM)+영수증 폴더+전월 지출결의서 양식 생성</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2026-07-01T09:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByMonth>
        <DaysOfMonth><Day>1</Day></DaysOfMonth>
        <Months>
          <January/><February/><March/><April/><May/><June/>
          <July/><August/><September/><October/><November/><December/>
        </Months>
      </ScheduleByMonth>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <Enabled>true</Enabled>
    <ExecutionTimeLimit>PT5M</ExecutionTimeLimit>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-NoProfile -ExecutionPolicy Bypass -File "$script"</Arguments>
    </Exec>
  </Actions>
</Task>
"@

Register-ScheduledTask -TaskName $taskName -Xml $xml -Force | Out-Null
Write-Output ("등록 완료: " + $taskName)
$t = Get-ScheduledTask -TaskName $taskName
Write-Output ("상태: " + $t.State)
(Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime
