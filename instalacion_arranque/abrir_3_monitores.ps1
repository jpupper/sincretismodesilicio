# =====================================================================
#  SINCRETISMO DE SILICIO - ARRANQUE DE INSTALACION EN 3 MONITORES
# =====================================================================
#  Abre una pagina por monitor en PANTALLA COMPLETA (--kiosk).
#
#  QUE experiencia va en cada monitor lo decide el PANEL DE ADMIN
#  (http://localhost:6932/admin -> /api/monitors). El script lee esa
#  asignacion en vivo; si el server no responde usa el default:
#      monitor 1  (izquierda) -> cluster 3D   (/cosmos-clusters.html)
#      monitor 2  (centro)    -> cambiapalabras (/cambiapalabras.html)
#      monitor 3  (derecha)   -> log          (/log)
#
#  Los monitores se detectan solos y se ordenan de IZQUIERDA a DERECHA,
#  asi que la asignacion se vuelve a levantar sola en cada reinicio.
#
#  Uso:
#      powershell -NoProfile -ExecutionPolicy Bypass -File abrir_3_monitores.ps1
#      powershell ... -File abrir_3_monitores.ps1 -Windowed   (sin fullscreen)
# =====================================================================
param(
    [switch]$Windowed,           # por defecto abre en PANTALLA COMPLETA (kiosk)
    [int]$WaitSeconds = 90
)

$ErrorActionPreference = 'Continue'

$BASE       = 'http://localhost:6932'
$PORTS      = @(6932, 3250)          # sincretismo + jp shader editor local
$CHROME_CANDIDATES = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

# URL de cada experiencia (ids = los que usa el server / el panel de admin)
$URLS = @{
    cambiapalabras = "$BASE/cambiapalabras.html"
    cluster        = "$BASE/cosmos-clusters.html"
    log            = "$BASE/log"
}

function Write-Step($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Cyan }

# --- 1) chrome.exe ---------------------------------------------------
$CHROME = $CHROME_CANDIDATES | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $CHROME) {
    Write-Host "[ERROR] No encuentro chrome.exe. Instalaciones buscadas:" -ForegroundColor Red
    $CHROME_CANDIDATES | ForEach-Object { Write-Host "   $_" }
    exit 1
}
Write-Step "Chrome: $CHROME"

# --- 2) esperar los servidores ---------------------------------------
function Wait-Port([int]$Port, [int]$Seconds) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(800) -and $c.Connected) { $c.Close(); return $true }
            $c.Close()
        } catch { }
        Start-Sleep -Milliseconds 700
    }
    return $false
}

foreach ($p in $PORTS) {
    Write-Host "   esperando puerto $p ..." -NoNewline
    if (Wait-Port -Port $p -Seconds $WaitSeconds) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " NO RESPONDE (sigo igual)" -ForegroundColor Yellow
    }
}

# --- 3) asignacion monitor -> experiencia (la manda el panel de admin) ----
$asign = [ordered]@{ monitor1 = 'cluster'; monitor2 = 'cambiapalabras'; monitor3 = 'log' }
try {
    $m = Invoke-RestMethod -Uri "$BASE/api/monitors" -TimeoutSec 6 -ErrorAction Stop
    foreach ($k in @('monitor1', 'monitor2', 'monitor3')) {
        $v = $m.$k
        if ($v -and $URLS.ContainsKey($v)) { $asign[$k] = $v }
    }
    Write-Host ("   asignacion (panel de admin): " + (($asign.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '  ')) -ForegroundColor Green
} catch {
    Write-Host "   [AVISO] no pude leer /api/monitors; uso la asignacion por defecto" -ForegroundColor Yellow
}

# --- 4) monitores ordenados de izquierda a derecha --------------------
Add-Type -AssemblyName System.Windows.Forms
$screens = @([System.Windows.Forms.Screen]::AllScreens |
             Sort-Object @{Expression = { $_.Bounds.X } }, @{Expression = { $_.Bounds.Y } })

Write-Step "Monitores detectados ($($screens.Count))"
foreach ($s in $screens) {
    $b = $s.Bounds
    Write-Host ("   {0}  X={1} Y={2}  {3}x{4}  primary={5}" -f $s.DeviceName, $b.X, $b.Y, $b.Width, $b.Height, $s.Primary)
}

if ($screens.Count -lt 3) {
    Write-Host "[AVISO] Hay menos de 3 monitores activos: se van a superponer paginas." -ForegroundColor Yellow
}
function Scr([int]$i) {
    if ($i -lt $screens.Count) { return $screens[$i] } else { return $screens[$screens.Count - 1] }
}

# el PLAN se arma con la asignacion (monitor1..3) y el monitor que le toca:
# izquierda = indice 0, centro = 1, derecha = el ultimo detectado
$PLAN = @()
$idx = 0
foreach ($k in @('monitor1', 'monitor2', 'monitor3')) {
    $exp = $asign[$k]
    $scr = if ($idx -eq 2) { Scr ($screens.Count - 1) } else { Scr $idx }
    $PLAN += @{ key = $k; prof = $k; exp = $exp; url = $URLS[$exp]; scr = $scr }
    $idx++
}

$PROFILE_ROOT = Join-Path $env:LOCALAPPDATA 'sincretismo-kiosco'

function Initialize-KioskProfile([string]$profileDir) {
    $script = @"
const fs = require('fs');
const path = require('path');
const profDir = process.argv[1];
const defDir = path.join(profDir, 'Default');
if (!fs.existsSync(defDir)) fs.mkdirSync(defDir, { recursive: true });

const prefFile = path.join(defDir, 'Preferences');
let pref = {};
try { pref = JSON.parse(fs.readFileSync(prefFile, 'utf8')); } catch (e) { pref = {}; }

pref.profile = pref.profile || {};
pref.profile.content_settings = pref.profile.content_settings || {};
pref.profile.content_settings.exceptions = pref.profile.content_settings.exceptions || {};

const exc = pref.profile.content_settings.exceptions;
exc.media_stream_camera = exc.media_stream_camera || {};
exc.media_stream_mic = exc.media_stream_mic || {};

const origins = [
  'http://localhost:6932,*',
  'http://127.0.0.1:6932,*',
  'http://localhost:3250,*',
  'http://127.0.0.1:3250,*'
];
for (const o of origins) {
  exc.media_stream_camera[o] = { setting: 1 };
  exc.media_stream_mic[o] = { setting: 1 };
}

pref.profile.exit_type = 'Normal';
pref.profile.exited_cleanly = true;

const mainPref = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Preferences');
if (fs.existsSync(mainPref)) {
  try {
    const mainObj = JSON.parse(fs.readFileSync(mainPref, 'utf8'));
    if (mainObj.media && mainObj.media.video_input) {
      pref.media = pref.media || {};
      pref.media.video_input = mainObj.media.video_input;
    }
  } catch (e) {}
}

fs.writeFileSync(prefFile, JSON.stringify(pref, null, 2), 'utf8');
"@
    node -e $script $profileDir 2>$null
}

# --- 5) lanzar una ventana de Chrome por monitor ---------------------
# cierro instancias previas de ESTE kiosco (perfiles sincretismo-kiosco) para
# que re-ejecutar el .bat no abra ventanas de mas
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*sincretismo-kiosco*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Liberar servicios de captura de video huerfanos si estuvieran bloqueando la camara
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*video_capture.mojom.VideoCaptureService*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

Write-Step "Abriendo ventanas (fullscreen = $(-not $Windowed))"
foreach ($item in $PLAN) {
    if (-not $item.url) {
        Write-Host ("   {0,-9} -> (sin experiencia asignada: no abro ventana)" -f $item.key) -ForegroundColor Yellow
        continue
    }
    $b    = $item.scr.Bounds
    $prof = Join-Path $PROFILE_ROOT $item.prof
    New-Item -ItemType Directory -Force -Path $prof | Out-Null

    # Inyectar permisos explicitos de camara en el perfil antes del arranque
    Initialize-KioskProfile -profileDir $prof

    $cargs = @(
        "--user-data-dir=$prof",
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-session-crashed-bubble',
        '--disable-infobars',
        '--use-fake-ui-for-media-stream',                              # concede camara sin dialogos
        '--autoplay-policy=no-user-gesture-required',
        '--unsafely-treat-insecure-origin-as-secure=http://localhost:6932,http://127.0.0.1:6932,http://localhost:3250,http://127.0.0.1:3250',
        '--allow-running-insecure-content',
        '--enable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio',
        '--disable-features=Translate,OptimizationHints,MediaRouter',
        "--app=$($item.url)",
        "--window-position=$($b.X),$($b.Y)",
        "--window-size=$($b.Width),$($b.Height)"
    )
    if (-not $Windowed) { $cargs += '--kiosk' }    # PANTALLA COMPLETA por defecto

    Write-Host ("   {0,-9} -> {1}   [{2}]   ({3},{4} {5}x{6})" -f $item.key, $item.exp, $item.url, $b.X, $b.Y, $b.Width, $b.Height)
    Start-Process -FilePath $CHROME -ArgumentList $cargs | Out-Null
    Start-Sleep -Milliseconds 2500      # que cada instancia arranque antes de la siguiente
}

# --- 6) verificar donde cayeron las ventanas -------------------------
Start-Sleep -Seconds 6
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinRect {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
Write-Step "Ventanas de Chrome abiertas"
Get-Process chrome -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } |
    ForEach-Object {
        $r = New-Object WinRect+RECT
        [void][WinRect]::GetWindowRect($_.MainWindowHandle, [ref]$r)
        Write-Host ("   PID {0,-7} X={1,-6} Y={2,-4} {3}x{4}  [{5}]" -f `
            $_.Id, $r.Left, $r.Top, ($r.Right - $r.Left), ($r.Bottom - $r.Top), $_.MainWindowTitle)
    }

Write-Host ""
Write-Host "Listo. La instalacion quedo levantada en los 3 monitores." -ForegroundColor Green
