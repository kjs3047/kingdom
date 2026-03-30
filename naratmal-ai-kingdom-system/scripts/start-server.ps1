$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $root '.runtime'
$pidFile = Join-Path $stateDir 'server.pid'
$logFile = Join-Path $stateDir 'server.log'
$port = 43110

New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Set-Content -Path $pidFile -Value $listener.OwningProcess
  Write-Output "already_running:$($listener.OwningProcess)"
  Write-Output "log:$logFile"
  exit 0
}

if (Test-Path $pidFile) {
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

if (Test-Path $logFile) {
  Remove-Item $logFile -Force -ErrorAction SilentlyContinue
}

$command = "cd /d `"$root`" && npm run start:server >> `"$logFile`" 2>&1"
$proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $command -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Set-Content -Path $pidFile -Value $listener.OwningProcess
  Write-Output "started:$($listener.OwningProcess)"
  Write-Output "log:$logFile"
  exit 0
}

Set-Content -Path $pidFile -Value $proc.Id
Write-Output "started_pending:$($proc.Id)"
Write-Output "log:$logFile"
