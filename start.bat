@echo off
setlocal

cd /d "%~dp0"

echo ====================================
echo Banana Slides one-click launcher
echo ====================================
echo.

call :check_command node "Node.js 18+"
if errorlevel 1 goto :failed

call :check_command npm "npm"
if errorlevel 1 goto :failed

call :check_command uv "uv"
if errorlevel 1 goto :failed

if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env from .env.example ...
        copy ".env.example" ".env" >nul
    )
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies ...
    pushd "frontend"
    call npm install
    if errorlevel 1 (
        popd
        goto :failed
    )
    popd
)

if not exist ".venv" (
    echo Syncing Python dependencies ...
    call uv sync
    if errorlevel 1 goto :failed
)

echo Starting backend on http://localhost:5000 ...
start "Banana Slides Backend" cmd /k "cd /d ""%~dp0backend"" && uv run python app.py"

echo Starting frontend on http://localhost:3000 ...
start "Banana Slides Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo Services are starting in separate windows.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

exit /b 0

:check_command
where %1 >nul 2>nul
if errorlevel 1 (
    echo Missing %~2. Please install it and run this script again.
    exit /b 1
)
exit /b 0

:failed
echo.
echo Startup failed. Check the messages above.
pause
exit /b 1
