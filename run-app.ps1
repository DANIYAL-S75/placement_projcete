Write-Host ">>> Starting TaskFlow Services..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\placement project\backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\placement project\frontend'; npm run dev"
Write-Host ">>> Both backend (http://localhost:5000) and frontend (http://localhost:5173) are launching in dedicated windows!" -ForegroundColor Green