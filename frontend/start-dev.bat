@echo off
cd /d C:\Users\lurro\Documents\work\crm-platform\frontend
node node_modules\vite\bin\vite.js > frontend-start.log 2>&1
if errorlevel 1 (
    echo ERROR occurred
    pause
)
