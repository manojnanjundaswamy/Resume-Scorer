# ResumeScore AI — Local Dev Startup Script
# Run this from PowerShell: .\start-local.ps1
# Or right-click > "Run with PowerShell"

$ErrorActionPreference = "Continue"
$rootDir = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ResumeScore AI — Local Dev Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check Java 21 ─────────────────────────────────────────────────────────
Write-Host "[1/5] Checking Java version..." -ForegroundColor Yellow
try {
    $javaVersion = (java -version 2>&1)[0].ToString()
    Write-Host "      Found: $javaVersion" -ForegroundColor Gray
    if ($javaVersion -notmatch "21\.|22\.|23\.") {
        Write-Host ""
        Write-Host "  ⚠  WARNING: Java 21+ is required." -ForegroundColor Red
        Write-Host "     Download from: https://adoptium.net" -ForegroundColor Red
        Write-Host "     Current version may cause build failures." -ForegroundColor Red
        Write-Host ""
        Read-Host "  Press Enter to continue anyway, or Ctrl+C to cancel"
    } else {
        Write-Host "      ✓ Java OK" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Java not found! Install Java 21 from https://adoptium.net" -ForegroundColor Red
    exit 1
}

# ── 2. Check Docker ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "      Found: $dockerVersion" -ForegroundColor Gray

    # Check if Docker daemon is actually responding
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  ✗ Docker daemon is not running!" -ForegroundColor Red
        Write-Host "    Please start Docker Desktop and wait for it to fully load," -ForegroundColor Red
        Write-Host "    then re-run this script." -ForegroundColor Red
        Write-Host ""
        Write-Host "    TIP: Look for the Docker whale icon in your system tray." -ForegroundColor Yellow
        Write-Host "         It should be solid white (not animated) when ready." -ForegroundColor Yellow
        Read-Host "  Press Enter when Docker is running to retry, or Ctrl+C to exit"
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Still not running. Please start Docker Desktop manually." -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "      ✓ Docker OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker not found! Install from https://docs.docker.com/desktop/windows/" -ForegroundColor Red
    exit 1
}

# ── 3. Check AI API key ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/5] Checking .env configuration..." -ForegroundColor Yellow
$envFile = Join-Path $rootDir "springboot-backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw

    $hasKey = $false
    if ($envContent -match "ANTHROPIC_API_KEY=sk-") { $hasKey = $true; Write-Host "      ✓ Anthropic (Claude) key found" -ForegroundColor Green }
    if ($envContent -match "OPENAI_API_KEY=sk-")    { $hasKey = $true; Write-Host "      ✓ OpenAI key found" -ForegroundColor Green }
    if ($envContent -match "GEMINI_API_KEY=\S")     { $hasKey = $true; Write-Host "      ✓ Gemini key found" -ForegroundColor Green }
    if ($envContent -match "OPENROUTER_API_KEY=sk-") { $hasKey = $true; Write-Host "      ✓ OpenRouter key found" -ForegroundColor Green }

    if (-not $hasKey) {
        Write-Host ""
        Write-Host "  ⚠  No AI API key found in springboot-backend\.env" -ForegroundColor Red
        Write-Host "     Open that file and add at least one key, e.g.:" -ForegroundColor Yellow
        Write-Host "       ANTHROPIC_API_KEY=your-anthropic-api-key" -ForegroundColor Yellow
        Write-Host "     Get a key at: https://console.anthropic.com" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "  Press Enter to continue without AI key (analysis will fail), or Ctrl+C to cancel"
    }
} else {
    Write-Host "  ✗ springboot-backend\.env not found!" -ForegroundColor Red
    exit 1
}

# ── 4. Start Docker services ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Starting Docker services (Postgres + MinIO)..." -ForegroundColor Yellow
Set-Location (Join-Path $rootDir "springboot-backend")

# Stop any leftover containers first
Write-Host "      Stopping any existing containers..." -ForegroundColor Gray
docker compose down 2>&1 | Out-Null

# Start fresh
Write-Host "      Starting postgres and minio..." -ForegroundColor Gray
docker compose up postgres minio -d 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  ✗ Docker compose failed!" -ForegroundColor Red
    Write-Host "    Common fixes:" -ForegroundColor Yellow
    Write-Host "    1. Right-click Docker Desktop tray icon > Switch to Linux containers" -ForegroundColor Yellow
    Write-Host "    2. Restart Docker Desktop completely" -ForegroundColor Yellow
    Write-Host "    3. Run: wsl --update  (in an admin PowerShell)" -ForegroundColor Yellow
    exit 1
}

Write-Host "      Waiting for services to be healthy..." -ForegroundColor Gray
Start-Sleep -Seconds 8

$psOutput = docker compose ps 2>&1
Write-Host $psOutput -ForegroundColor Gray

Write-Host "      ✓ Docker services started" -ForegroundColor Green
Write-Host ""
Write-Host "      MinIO console: http://localhost:9001  (minioadmin / minioadmin)" -ForegroundColor Cyan
Write-Host "      PostgreSQL:    localhost:5432  (resumescorer / resumescorer_dev)" -ForegroundColor Cyan

# ── 5. Start Spring Boot ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Starting Spring Boot API..." -ForegroundColor Yellow
Write-Host "      (First run downloads ~150MB of Maven deps — takes 3-5 min)" -ForegroundColor Gray
Write-Host ""
Write-Host "  The API will be at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Health check:       http://localhost:8080/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  When you see 'Started ResumeScorerApplication'" -ForegroundColor White
Write-Host "  open a NEW terminal and run:" -ForegroundColor White
Write-Host ""
Write-Host "    cd web-app" -ForegroundColor Yellow
Write-Host "    npm install" -ForegroundColor Yellow
Write-Host "    npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# Run Spring Boot in this window (blocks until Ctrl+C)
.\mvnw.cmd spring-boot:run
