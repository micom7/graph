@echo off
cd /d "%~dp0"
docker compose up -d
timeout /t 2 /nobreak >nul
start http://localhost:5173