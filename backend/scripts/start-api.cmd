@echo off
cd /d "C:\Users\Owner\Desktop\Dokan\backend"
if errorlevel 1 (
  echo Cannot access the Dokan backend directory.
  pause
  exit /b 1
)
"C:\Program Files\nodejs\node.exe" "C:\Users\Owner\Desktop\Dokan\backend\src\server.js"
set "api_exit_code=%errorlevel%"
echo.
echo Dokan API stopped with exit code %api_exit_code%.
pause
exit /b %api_exit_code%
