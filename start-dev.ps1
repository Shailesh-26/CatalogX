# CatalogX — start backend + frontend in two PowerShell windows.
# Run from the project root:   powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$root\backend\.env")) {
  Write-Host "backend\.env not found - copying .env.example. Fill in JWT_SECRET etc. and run again." -ForegroundColor Yellow
  Copy-Item "$root\backend\.env.example" "$root\backend\.env"
  exit 1
}

if (-not (Test-Path "$root\backend\node_modules"))  { Write-Host "Installing backend packages...";  Push-Location "$root\backend";  npm install; Pop-Location }
if (-not (Test-Path "$root\frontend\node_modules")) { Write-Host "Installing frontend packages..."; Push-Location "$root\frontend"; npm install; Pop-Location }

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm start"

Write-Host "Backend:  http://localhost:5000  (health check: /api/health)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000  (opens automatically)"      -ForegroundColor Green
