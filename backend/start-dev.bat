@echo off
cd /d C:\Users\lurro\Documents\work\crm-platform\backend
node node_modules\@nestjs\cli\bin\nest.js start --watch > backend-start.log 2>&1
if errorlevel 1 (
    echo ERROR occurred
    pause
)
