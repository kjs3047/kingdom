$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $root '.runtime'
$pidFile = Join-Path $stateDir 'server.pid'
$port = 43110

$stopped = $false

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
  Write-Output "stopped_port_listener:$($listener.OwningProcess)"
  $stopped = $true
}

if (Test-Path $pidFile) {
  $serverPid = Get-Content $pidFile -ErrorAction SilentlyContinue
  if ($serverPid) {
    $proc = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
    if ($proc) {
      Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
      Write-Output "stopped_pid:$serverPid"
      $stopped = $true
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not $stopped) {
  Write-Output 'not_running'
}
