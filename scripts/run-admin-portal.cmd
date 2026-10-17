@echo off
cd /d "C:\Users\Owner\Desktop\Dokan"
"C:\Program Files\nodejs\node.exe" "server.js"
exit /b %errorlevel%
