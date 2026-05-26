param(
    [switch]$SkipDocker,
    [switch]$SkipPreflight
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
$backendDir = Join-Path $rootDir "springboot-backend"
$webDir = Join-Path $rootDir "web-app"

function Write-Step($Message) {
    Write-Host ""
    Write-Host $Message -ForegroundColor Cyan
}

function Test-Command($Name, $InstallHint) {
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "$Name was not found. $InstallHint"
    }
}

Write-Host "ResumeScore AI local startup" -ForegroundColor Cyan
Write-Host "Root: $rootDir" -ForegroundColor DarkGray

if (-not (Test-Path $backendDir)) { throw "Missing folder: $backendDir" }
if (-not (Test-Path $webDir)) { throw "Missing folder: $webDir" }

if (-not $SkipPreflight) {
    Write-Step "[1/4] Checking prerequisites"
    Test-Command "java" "Install Java 21 from https://adoptium.net/."
    Test-Command "docker" "Install Docker Desktop and start it."
    Test-Command "node" "Install Node.js 18 or newer."
    Test-Command "npm" "Install Node.js 18 or newer."

    $javaVersion = (java -version 2>&1)[0].ToString()
    Write-Host "Java: $javaVersion"
    if ($javaVersion -notmatch '"21\.|"22\.|"23\.|"24\.|"25\.') {
        Write-Warning "Java 21 or newer is recommended for the backend."
    }

    Write-Host "Node: $(node --version)"
    Write-Host "npm:  $(npm --version)"
    Write-Host "Docker: $(docker --version)"
}

Write-Step "[2/4] Checking environment files"
$backendEnv = Join-Path $backendDir ".env"
$webEnv = Join-Path $webDir ".env.local"

if (-not (Test-Path $backendEnv)) {
    Copy-Item (Join-Path $backendDir ".env.example") $backendEnv
    Write-Host "Created springboot-backend\.env from .env.example" -ForegroundColor Yellow
    Write-Host "Review it before using real AI/payment providers." -ForegroundColor Yellow
} else {
    Write-Host "Found springboot-backend\.env" -ForegroundColor Green
}

if (-not (Test-Path $webEnv)) {
    Copy-Item (Join-Path $webDir ".env.example") $webEnv
    Write-Host "Created web-app\.env.local from .env.example" -ForegroundColor Yellow
    Write-Host "Set VITE_GOOGLE_CLIENT_ID before testing Google login." -ForegroundColor Yellow
} else {
    Write-Host "Found web-app\.env.local" -ForegroundColor Green
}

if (-not $SkipDocker) {
    Write-Step "[3/4] Starting PostgreSQL and MinIO"
    Push-Location $backendDir
    try {
        docker info | Out-Null
        docker compose up postgres minio -d
        Start-Sleep -Seconds 5
        docker compose ps
    } finally {
        Pop-Location
    }
} else {
    Write-Step "[3/4] Skipping Docker startup"
}

Write-Step "[4/4] Starting Spring Boot backend"
Write-Host "Backend: http://localhost:8080"
Write-Host "Health:  http://localhost:8080/api/health"
Write-Host ""
Write-Host "In a second terminal, run:" -ForegroundColor Yellow
Write-Host "  cd web-app"
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open http://localhost:5173" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in this terminal to stop the backend." -ForegroundColor DarkGray

Push-Location $backendDir
try {
    & .\start-local.ps1
} finally {
    Pop-Location
}
