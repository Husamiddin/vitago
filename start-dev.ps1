# DoriScan Localhost Ishga Tushirish Skripti
Write-Host "💊 DoriScan serverlari ishga tushirilmoqda..." -ForegroundColor Green

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "✅ Backend API: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "✅ Frontend Sayt: http://localhost:5173" -ForegroundColor Green
