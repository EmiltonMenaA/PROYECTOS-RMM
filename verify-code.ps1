# Script para verificar el código de todo el proyecto
# Ejecuta ESLint y Prettier en backend y frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación de Código - Proyecto RMM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$hasErrors = $false

# Verificar Backend
Write-Host " Verificando Backend..." -ForegroundColor Yellow
Write-Host ""

Push-Location backend

if (Test-Path "node_modules") {
    Write-Host "  Running backend lint..." -ForegroundColor Gray
    npm run lint
    if ($LASTEXITCODE -ne 0) { $hasErrors = $true }

    Write-Host ""
    Write-Host "  Running backend format check..." -ForegroundColor Gray
    npm run format:check
    if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
} else {
    Write-Host "   Backend: node_modules no encontrado. Ejecuta 'npm install' primero." -ForegroundColor Red
    $hasErrors = $true
}

Pop-Location
Write-Host ""

# Verificar Frontend
Write-Host " Verificando Frontend..." -ForegroundColor Yellow
Write-Host ""

Push-Location frontend

if (Test-Path "node_modules") {
    Write-Host "  Running frontend lint..." -ForegroundColor Gray
    npm run lint
    if ($LASTEXITCODE -ne 0) { $hasErrors = $true }

    Write-Host ""
    Write-Host "  Running frontend format check..." -ForegroundColor Gray
    npm run format:check
    if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
} else {
    Write-Host "    Frontend: node_modules no encontrado. Ejecuta 'npm install' primero." -ForegroundColor Red
    $hasErrors = $true
}

Pop-Location
Write-Host ""

# Resultado final
Write-Host "========================================" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host " Verificación completada con errores" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para corregir automáticamente:" -ForegroundColor Yellow
    Write-Host "  Backend:  cd backend && npm run lint:fix && npm run format" -ForegroundColor Gray
    Write-Host "  Frontend: cd frontend && npm run lint:fix && npm run format" -ForegroundColor Gray
    exit 1
} else {
    Write-Host " Verificación completada exitosamente" -ForegroundColor Green
    Write-Host "   Todo el código cumple con los estándares" -ForegroundColor Green
    exit 0
}
