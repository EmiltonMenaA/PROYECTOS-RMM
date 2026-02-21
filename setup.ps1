#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Setup script rápido para Proyecto RMM — Windows PowerShell
.DESCRIPTION
    Instala dependencias y configura .env. No arranca servidores.
#>

Write-Host " RMM — Setup Rapido" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Detectar si estamos en la carpeta correcta
if (-not (Test-Path "backend\package.json")) {
    Write-Host " Error: Ejecuta este script desde la raíz del proyecto (ProyectoRmm/)" -ForegroundColor Red
    exit 1
}

# 1. Verificar Node.js
Write-Host "1️  Verificando Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host " Node.js no encontrado. Descárgalo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "    Node.js $nodeVersion" -ForegroundColor Green
Write-Host ""

# 2. Instalar dependencias
Write-Host "2️ Instalando dependencias backend..." -ForegroundColor Yellow
Push-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host " Error en npm install (backend)" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "   ✓ Dependencias backend instaladas" -ForegroundColor Green
Pop-Location
Write-Host ""

Write-Host "3️ Instalando dependencias frontend..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\package.json")) {
    Write-Host " Error: frontend\package.json no encontrado" -ForegroundColor Red
    exit 1
}
Push-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host " Error en npm install (frontend)" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "   ✓ Dependencias frontend instaladas" -ForegroundColor Green
Pop-Location
Write-Host ""

# 3. Crear/actualizar .env
Write-Host "4️  Configurando variables de entorno..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "    .env creado desde .env.example" -ForegroundColor Green
        Write-Host "     EDITA .env y configura DATABASE_URL y JWT_SECRET" -ForegroundColor Yellow
    } else {
        Write-Host "     .env.example no encontrado, crea .env manualmente" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✓ .env ya existe" -ForegroundColor Green
}
Write-Host ""

# 4. Mostrar instrucciones
Write-Host " Instrucciones finales:" -ForegroundColor Yellow
Write-Host ""
Write-Host "a) Edita backend\.env y configura:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL=postgresql://user:pass@localhost:5432/rmm_db" -ForegroundColor Gray
Write-Host "   JWT_SECRET=tu-clave-secreta" -ForegroundColor Gray
Write-Host ""
Write-Host "b) Crea la base de datos PostgreSQL:" -ForegroundColor Cyan
Write-Host "   psql -U postgres -c 'CREATE DATABASE rmm_db;'" -ForegroundColor Gray
Write-Host ""
Write-Host "c) Ejecuta migraciones (desde carpeta backend):" -ForegroundColor Cyan
Write-Host "   npm run migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "d) Ejecuta setup (crea admin, columnas):" -ForegroundColor Cyan
Write-Host "   node setup.js" -ForegroundColor Gray
Write-Host ""
Write-Host "e) Arranca el servidor backend:" -ForegroundColor Cyan
Write-Host "   npm run start" -ForegroundColor Gray
Write-Host "f) Arranca el frontend:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "g) Accede a:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor Gray
Write-Host "   http://localhost:4000/api/health" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ Setup listo. Sigue los pasos a-f arriba." -ForegroundColor Green
Write-Host ""
