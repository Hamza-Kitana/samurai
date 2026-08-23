@echo off
set PORT=%~1
if "%PORT%"=="" exit /b 0

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
  echo        Killing PID %%P on port %PORT%
  taskkill /F /PID %%P >nul 2>&1
)

exit /b 0
