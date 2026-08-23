@echo off
title Samurai Realm — Launcher
cd /d "%~dp0"

echo.
echo  ========================================
echo   Samurai Realm — Starting everything...
echo  ========================================
echo.

if not exist ".env" (
  echo [setup] Creating .env from .env.example
  copy /Y ".env.example" ".env" >nul
)

if not exist "node_modules\" (
  echo [setup] Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo [error] npm install failed
    pause
    exit /b 1
  )
)

echo [cleanup] Freeing ports 5000 and 5173 if busy...
call "%~dp0scripts\free-port.bat" 5000
call "%~dp0scripts\free-port.bat" 5173

echo [1/2] Starting API  ^(http://localhost:5000^)
start "Samurai API" cmd /k "cd /d %~dp0backend\SamuraiRealm.Api && dotnet run"

echo [wait] Giving the API a few seconds to boot...
timeout /t 6 /nobreak >nul

echo [2/2] Starting frontend
start "Samurai Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo  Done — two windows should be open:
echo    - Samurai API       ^> http://localhost:5000
echo    - Samurai Frontend  ^> http://localhost:8080 or :5173
echo.
echo  If login shows "Failed to fetch":
echo    1. Make sure the API window is running ^(no red errors^)
echo    2. Open http://localhost:5000/api/health in browser — should say ok
echo    3. Restart both with stop.bat then start.bat
echo.
echo  Admin login: admin / 222
echo  To stop everything: double-click stop.bat
echo.
pause
