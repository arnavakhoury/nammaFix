# ─────────────────────────────────────────────────────────────────────────────
# Nagawara Junction Traffic Dashboard — Local Server
# Run this script to serve the dashboard at http://localhost:8080
# No Node, Python, or any install required — uses PowerShell built-in .NET
# ─────────────────────────────────────────────────────────────────────────────

$port    = 8080
$root    = $PSScriptRoot
$url     = "http://localhost:$port/"
$prefix  = "http://localhost:$port/"

$mimeMap = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript'
  '.css'  = 'text/css'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   Nagawara Junction — Traffic Management Dashboard   ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Serving files from: $root" -ForegroundColor Gray
Write-Host "  Open in browser   : $url" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "  [ERROR] Could not bind to port $port. Try running as Administrator or change the port." -ForegroundColor Red
  Write-Host "  $_" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

# Auto-open browser
Start-Process $url

Write-Host "  [READY] Server running at $url" -ForegroundColor Green

while ($listener.IsListening) {
  try {
    $ctx      = $listener.GetContext()
    $req      = $ctx.Request
    $res      = $ctx.Response

    $rawPath  = $req.Url.LocalPath.TrimStart('/')
    if ($rawPath -eq '' -or $rawPath -eq '/') { $rawPath = 'index.html' }

    $filePath = Join-Path $root $rawPath

    if (Test-Path $filePath -PathType Leaf) {
      $ext      = [System.IO.Path]::GetExtension($filePath).ToLower()
      $mime     = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
      $bytes    = [System.IO.File]::ReadAllBytes($filePath)
      $res.ContentType   = $mime
      $res.ContentLength64 = $bytes.Length
      $res.StatusCode    = 200
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host "  [200] $($req.Url.LocalPath)" -ForegroundColor DarkGray
    } else {
      $body  = [System.Text.Encoding]::UTF8.GetBytes("404 — Not Found: $rawPath")
      $res.StatusCode    = 404
      $res.ContentType   = 'text/plain'
      $res.ContentLength64 = $body.Length
      $res.OutputStream.Write($body, 0, $body.Length)
      Write-Host "  [404] $($req.Url.LocalPath)" -ForegroundColor Red
    }

    $res.OutputStream.Close()
  } catch {
    # Ignore connection-reset errors on Ctrl+C
    if ($listener.IsListening) {
      Write-Host "  [WARN] $_" -ForegroundColor Yellow
    }
  }
}

$listener.Stop()
Write-Host "  Server stopped." -ForegroundColor Gray
