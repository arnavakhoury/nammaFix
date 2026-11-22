@echo off
title Nagawara Traffic Dashboard — Local Server
echo.
echo  Starting Nagawara Junction Traffic Dashboard...
echo  Browser will open automatically at http://localhost:8080
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
