$ErrorActionPreference = 'Stop'

$nodeCommands = @(
  'node',
  "$env:ProgramFiles\nodejs\node.exe",
  "${env:ProgramFiles(x86)}\nodejs\node.exe"
)

foreach ($cmd in $nodeCommands) {
  if (-not $cmd) { continue }
  try {
    & $cmd -v *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "[OK] Node.js ya esta instalado."
      exit 0
    }
  } catch {
    # Continuar buscando.
  }
}

$indexUrl = 'https://nodejs.org/download/release/latest-v22.x/'
$tempDir = Join-Path $env:TEMP 'UDH_NodeJS'
$installerPath = Join-Path $tempDir 'node-lts-x64.msi'

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "[INFO] Buscando instalador oficial Node.js LTS..."
$html = Invoke-WebRequest -Uri $indexUrl -UseBasicParsing
$match = [regex]::Match($html.Content, 'node-v[\d\.]+-x64\.msi')

if (-not $match.Success) {
  throw "No se encontro instalador x64 MSI en $indexUrl"
}

$fileName = $match.Value
$downloadUrl = "$indexUrl$fileName"

Write-Host "[INFO] Descargando $fileName..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing

Write-Host "[INFO] Instalando Node.js silenciosamente..."
$process = Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn /norestart" -Wait -PassThru

if ($process.ExitCode -notin @(0, 3010)) {
  throw "El instalador de Node.js fallo con codigo $($process.ExitCode)"
}

$nodePath = "$env:ProgramFiles\nodejs\node.exe"
if (-not (Test-Path $nodePath)) {
  throw "Node.js fue instalado, pero no se encontro $nodePath"
}

& $nodePath -v
Write-Host "[OK] Node.js instalado correctamente."
