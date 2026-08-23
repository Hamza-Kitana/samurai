@echo off
title Samurai Realm — Stop
cd /d "%~dp0"

echo.
echo  Stopping Samurai Realm...
echo.

call "%~dp0scripts\free-port.bat" 5000
call "%~dp0scripts\free-port.bat" 5173

taskkill /FI "WINDOWTITLE eq Samurai API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Samurai Frontend*" /F >nul 2>&1

echo  Ports 5000 and 5173 cleared.
echo  You can run start.bat again.
echo.
pause
