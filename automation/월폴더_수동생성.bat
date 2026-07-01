@echo off
chcp 65001 > nul
REM manual monthly folder creator - runs manual_folder.ps1 (double-click)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0manual_folder.ps1" %*
echo.
pause
