# ============================================================
# DURIN ENGINE - Deploy automatizado
# ============================================================
# Uso: .\scripts\deploy.ps1
# Requisitos: Node 22+, npm, Angular CLI (local), Wrangler, Git
# ============================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# -- Colores para output --
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"
$CYAN = "Cyan"

$script:stepResults = @()

function Write-Step {
    param([string]$Name)
    Write-Host ""
    Write-Host ">>> $Name" -ForegroundColor $CYAN
}

function Write-OK {
    param([string]$Message)
    Write-Host "    [OK] $Message" -ForegroundColor $GREEN
    $script:stepResults += [PSCustomObject]@{ Step = $Message; Status = "OK" }
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    [FAIL] $Message" -ForegroundColor $RED
    $script:stepResults += [PSCustomObject]@{ Step = $Message; Status = "FAIL" }
    Write-Host ""
    Write-Host "DEPLOYMENT FAILED: $Message" -ForegroundColor $RED
    Write-Host ""
    Write-Host "Resumen de pasos ejecutados:" -ForegroundColor $YELLOW
    $script:stepResults | Format-Table -AutoSize
    exit 1
}

function Write-Warn {
    param([string]$Message)
    Write-Host "    [WARN] $Message" -ForegroundColor $YELLOW
}

# ============================================================
# PASO 0: Detectar raÃ­z del proyecto
# ============================================================
$ROOT = Split-Path -Parent $PSScriptRoot
Set-Location $ROOT

Write-Host ""
Write-Host "============================================================" -ForegroundColor $CYAN
Write-Host "  DURIN ENGINE - DEPLOYMENT" -ForegroundColor $CYAN
Write-Host "============================================================" -ForegroundColor $CYAN

# ============================================================
# PASO 1: Validaciones
# ============================================================
Write-Step "1/7 Validaciones previas"

# Node
try {
    $nodeVersion = (node --version) -replace 'v', ''
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -lt 22) {
        Write-Fail "Node.js >= 22 requerido (actual: $nodeVersion)"
    }
    Write-OK "Node.js $nodeVersion"
} catch {
    Write-Fail "Node.js no encontrado"
}

# npm
try {
    $npmVersion = npm --version
    Write-OK "npm $npmVersion"
} catch {
    Write-Fail "npm no encontrado"
}

# Git
try {
    $gitVersion = (git --version) -replace 'git version ', ''
    Write-OK "git $gitVersion"
} catch {
    Write-Fail "git no encontrado"
}

# Wrangler (via npx para no depender de instalacion global)
try {
    $wranglerOutput = (& npx --yes wrangler@latest --version 2>&1 | Out-String).Trim()
    if ($wranglerOutput -match '(\d+\.\d+\.\d+)') {
        Write-OK "wrangler $($matches[1]) (via npx)"
    } else {
        Write-Fail "wrangler no responde correctamente (output: $wranglerOutput)"
    }
} catch {
    Write-Fail "wrangler no disponible via npx"
}

# Archivo .env.deploy
if (-not (Test-Path ".env.deploy")) {
    Write-Fail "Falta .env.deploy en la raÃ­z del proyecto"
}

# Cargar .env.deploy
$envVars = @{}
Get-Content .env.deploy | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split('=', 2)
        if ($parts.Count -eq 2) {
            $envVars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

$requiredVars = @("RENDER_DEPLOY_HOOK", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_PROJECT_NAME", "PROD_DATABASE_URL", "PROD_API_URL", "PROD_FRONTEND_URL")
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        Write-Fail "Variable $var no definida en .env.deploy"
    }
}
Write-OK ".env.deploy con $($requiredVars.Count) variables"

# ============================================================
# PASO 2: Tests backend
# ============================================================
Write-Step "2/7 Tests backend"

Push-Location backend
try {
    Write-Host "    Ejecutando tests en DB local..." -ForegroundColor $YELLOW
    $env:DATABASE_URL = "postgresql://durin_user:durin_password@localhost:5433/durin_engine?schema=public"
    npm test
    $testExitCode = $LASTEXITCODE
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
    if ($testExitCode -ne 0) {
        Pop-Location
        Write-Fail "Tests backend fallaron"
    }
    Write-OK "Tests backend (16/16) en DB local"
} finally {
    Pop-Location -ErrorAction SilentlyContinue
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
}

# ============================================================
# PASO 3: Build backend
# ============================================================
Write-Step "3/7 Build backend"

Push-Location backend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "    Instalando dependencias..." -ForegroundColor $YELLOW
        npm install
    }
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Fail "Build backend fallÃ³"
    }
    Write-OK "Build backend"
} finally {
    Pop-Location -ErrorAction SilentlyContinue
}

# ============================================================
# PASO 4: Migraciones Neon (producciÃ³n)
# ============================================================
Write-Step "4/7 Migraciones base de datos (Neon)"

Push-Location backend
try {
    $env:DATABASE_URL = $envVars["PROD_DATABASE_URL"]
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Fail "Migraciones fallaron"
    }
    Write-OK "Migraciones aplicadas en Neon"
} finally {
    Pop-Location -ErrorAction SilentlyContinue
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
}
# ============================================================
# PASO 5: Build frontend
# ============================================================
Write-Step "5/7 Build frontend"

Push-Location frontend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "    Instalando dependencias..." -ForegroundColor $YELLOW
        npm install
    }

    # Reemplazar environment.prod.ts con la URL del backend de produccion
    $envProdFile = "src/environments/environment.prod.ts"
    $envProdContent = @"
export const environment = {
  production: true,
  apiUrl: '$($envVars["PROD_API_URL"])/api',
};
"@
    Set-Content -Path $envProdFile -Value $envProdContent -Encoding utf8

    npx ng build --configuration=production
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Fail "Build frontend fallÃ³"
    }
    Write-OK "Build frontend production"
} finally {
    Pop-Location -ErrorAction SilentlyContinue
}

# ============================================================
# PASO 6a: Deploy backend (disparar Render Deploy Hook)
# ============================================================
Write-Step "6a/7 Deploy backend (Render)"

try {
    $renderResponse = Invoke-RestMethod -Uri $envVars["RENDER_DEPLOY_HOOK"] -Method Get
    Write-OK "Render deploy disparado"
} catch {
    Write-Fail "No se pudo disparar el deploy de Render: $_"
}

# Esperar a que Render termine el deploy y el servicio estÃ© Live
Write-Host "    Esperando deploy de Render (mÃ¡x 5 min)..." -ForegroundColor $YELLOW
$maxWait = 300
$elapsed = 0
$healthOk = $false

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 15
    $elapsed += 15
    try {
        $health = Invoke-RestMethod -Uri "$($envVars["PROD_API_URL"])/health" -TimeoutSec 30
        if ($health.status -eq "ok" -and $health.database -eq "connected") {
            $healthOk = $true
            break
        }
    } catch {
        Write-Host "    Aun no responde (esperando... ${elapsed}s)" -ForegroundColor $YELLOW
    }
}

if (-not $healthOk) {
    Write-Fail "Render no respondiÃ³ /health OK despuÃ©s de 5 min"
}
Write-OK "Backend live: $($envVars["PROD_API_URL"])/health"

# ============================================================
# PASO 6b: Deploy frontend (Cloudflare Pages)
# ============================================================
Write-Step "6b/7 Deploy frontend (Cloudflare Pages)"

$env:CLOUDFLARE_API_TOKEN = $envVars["CLOUDFLARE_API_TOKEN"]
$env:CLOUDFLARE_ACCOUNT_ID = $envVars["CLOUDFLARE_ACCOUNT_ID"]

Push-Location frontend
try {
        npx --yes wrangler@latest pages deploy dist/frontend/browser --project-name=$($envVars["CLOUDFLARE_PROJECT_NAME"]) --branch=main --commit-dirty=true
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Fail "Deploy a Cloudflare Pages fallÃ³"
    }
    Write-OK "Cloudflare Pages deploy exitoso"
} finally {
    Pop-Location -ErrorAction SilentlyContinue
    Remove-Item Env:\CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:\CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
}

# ============================================================
# PASO 7: VerificaciÃ³n final
# ============================================================
Write-Step "7/7 VerificaciÃ³n final"

# Backend /health
try {
    $finalHealth = Invoke-RestMethod -Uri "$($envVars["PROD_API_URL"])/health" -TimeoutSec 30
    if ($finalHealth.status -eq "ok" -and $finalHealth.database -eq "connected") {
        Write-OK "Backend /health responde OK"
    } else {
        Write-Fail "Backend /health con estado inesperado"
    }
} catch {
    Write-Fail "Backend /health no responde"
}

# Frontend GET /
try {
    $frontResponse = Invoke-WebRequest -Uri $envVars["PROD_FRONTEND_URL"] -UseBasicParsing -TimeoutSec 30
    if ($frontResponse.StatusCode -eq 200) {
        Write-OK "Frontend responde HTTP 200"
    } else {
        Write-Fail "Frontend respondiÃ³ HTTP $($frontResponse.StatusCode)"
    }
} catch {
    Write-Fail "Frontend no responde"
}

# ============================================================
# RESUMEN FINAL
# ============================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor $GREEN
Write-Host "  DURIN ENGINE DEPLOYMENT" -ForegroundColor $GREEN
Write-Host "============================================================" -ForegroundColor $GREEN
Write-Host ""
foreach ($r in $script:stepResults) {
    if ($r.Status -eq "OK") {
        Write-Host "  [OK]   $($r.Step)" -ForegroundColor $GREEN
    } else {
        Write-Host "  [FAIL] $($r.Step)" -ForegroundColor $RED
    }
}
Write-Host ""
Write-Host "  URL Frontend: $($envVars["PROD_FRONTEND_URL"])" -ForegroundColor $CYAN
Write-Host "  URL Backend:  $($envVars["PROD_API_URL"])" -ForegroundColor $CYAN
Write-Host ""
Write-Host "  DEPLOYMENT SUCCESSFUL." -ForegroundColor $GREEN
Write-Host "============================================================" -ForegroundColor $GREEN
Write-Host ""

exit 0
