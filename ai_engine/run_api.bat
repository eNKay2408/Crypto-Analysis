@echo off
echo ================================
echo Starting AI Engine API Server
echo ================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install requirements
echo Installing/updating dependencies...
pip install -r requirements.txt
echo.

REM Check for .env file
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please create .env file from .env.example
    echo.
    pause
    exit /b 1
)

REM Start the server
echo Starting API server...
echo.
python api_server.py

pause
