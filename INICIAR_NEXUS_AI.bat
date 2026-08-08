@echo off
cd /d "%~dp0"
echo ========================================
echo  NEXUS AI - servidor local
echo ========================================
node server\server.js
if errorlevel 1 (
  echo.
  echo No se pudo iniciar NEXUS AI.
  echo Revisa Node.js, server\.env y tu GEMINI_API_KEY.
  pause
)
