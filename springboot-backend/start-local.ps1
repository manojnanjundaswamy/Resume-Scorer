# Loads .env and starts Spring Boot with all env vars in scope
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match "^\s*[^#].*=.*" } | ForEach-Object {
        $parts = $_ -split "=", 2
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
    Write-Host "Loaded .env" -ForegroundColor Green
}

& "$PSScriptRoot\mvnw.cmd" spring-boot:run
