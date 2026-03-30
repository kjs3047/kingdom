$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $root '.runtime'
$pidFile = Join-Path $stateDir 'server.pid'
$logFile = Join-Path $stateDir 'server.log'
$port = 43110

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Write-Output 'status:running'
  Write-Output "pid:$($listener.OwningProcess)"
  Write-Output "port:$port"
  if (Test-Path $logFile) {
    Write-Output "log:$logFile"
  }
  exit 0
}

if (Test-Path $pidFile) {
  Write-Output 'status:stale_pid_file'
  exit 0
}

Write-Output 'status:not_running'
