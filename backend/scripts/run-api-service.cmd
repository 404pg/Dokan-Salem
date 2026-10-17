@echo off
cd /d "C:\Users\Owner\Desktop\Dokan\backend"
"C:\Program Files\nodejs\node.exe" "src\server.js"
exit /b %errorlevel%