# -*- coding: utf-8 -*-
"""
Sube el frontend estatico de Sincretismo de Silicio al FTP de Ferozo.

Uso:
    python deploy_scripts/upload_ftp_sincretismo.py

Credenciales: se leen de (.env del proyecto si existe) o de
D:\\Programacion\\sistemasfullscreen\\megaskill\\.env  (FTP_HOST / FTP_USER / FTP_PASS).

Destino: /sincretismodesilicio/ en la raiz del FTP
   -> https://fullscreencode.com/sincretismodesilicio/

⚠️ OJO — limitacion conocida del host estatico:
El frontend llama a `/api/game-config` con ruta RELATIVA (public/js/game/standaloneGame.js).
En el FTP (Apache, sin backend) ese endpoint NO existe, asi que:
  - Cargar config: cae a defaults (tiene try/catch, no rompe).
  - Guardar config: muestra toast "Error de conexion con el servidor".
En el VPS (https://vps-4455523-x.dattaweb.com/) SI funciona, porque el Express lo sirve.
Si se quiere funcionalidad total desde el FTP, hay que apuntar gameSaveUrl/loadUrl al
VPS (o dejar el VPS como origen unico).
"""
import ftplib
import io
import pathlib
import ssl
import sys

PROJECT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = PROJECT / "public"
REMOTE_DIR = "sincretismodesilicio"
CRED_SOURCES = [PROJECT / ".env", PROJECT.parent / "sistemasfullscreen" / "megaskill" / ".env"]

# El .htaccess del FTP no se toca desde scripts (lo maneja el usuario).


def load_env() -> dict:
    cfg = {}
    for src in CRED_SOURCES:
        if not src.exists():
            continue
        for line in src.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k.startswith(("FTP_", "VPS_")):
                cfg.setdefault(k, v)
    return cfg


def connect(cfg: dict) -> ftplib.FTP_TLS:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ftp = ftplib.FTP_TLS(context=ctx)
    ftp.connect(cfg["FTP_HOST"], 21, timeout=30)
    ftp.login(cfg["FTP_USER"], cfg["FTP_PASS"])
    ftp.prot_p()
    return ftp


def ensure_dirs(ftp: ftplib.FTP_TLS, remote_dir: str) -> None:
    cur = ""
    for part in remote_dir.split("/"):
        if not part:
            continue
        cur = f"{cur}/{part}" if cur else part
        try:
            ftp.mkd(cur)
        except ftplib.error_perm:
            pass


def walk() -> list[tuple[pathlib.Path, str]]:
    out = []
    for f in sorted(PUBLIC.rglob("*")):
        if f.is_file():
            rel = f.relative_to(PUBLIC).as_posix()
            if rel.startswith(".") or f.name == ".htaccess":
                continue
            out.append((f, rel))
    return out


def main() -> int:
    cfg = load_env()
    if not (cfg.get("FTP_HOST") and cfg.get("FTP_USER") and cfg.get("FTP_PASS")):
        print("Faltan FTP_HOST/FTP_USER/FTP_PASS (revisa .env del proyecto o megaskill/.env)")
        return 1

    files = walk()
    print(f"{len(files)} archivos -> {cfg['FTP_HOST']}:/{REMOTE_DIR}/")
    try:
        ftp = connect(cfg)
    except ftplib.error_perm as e:
        print(f"LOGIN RECHAZADO: {e}")
        print("Actualizar FTP_PASS con la password vigente del panel de Ferozo.")
        return 2
    print("LOGIN OK")
    ensure_dirs(ftp, REMOTE_DIR)

    ok = fail = 0
    for local, rel in files:
        data = local.read_bytes()          # buffer en memoria: evita subidas de 0 bytes
        remote = f"{REMOTE_DIR}/{rel}"
        try:
            ensure_dirs(ftp, str(pathlib.PurePosixPath(remote).parent))
            ftp.storbinary(f"STOR {remote}", io.BytesIO(data))
            size = ftp.size(remote)
            if size == len(data):
                ok += 1
                print(f"OK   {remote} ({size} b)")
            else:
                fail += 1
                print(f"FAIL {remote} local={len(data)} remote={size}")
        except Exception as e:                                   # noqa: BLE001
            fail += 1
            print(f"FAIL {remote} :: {e}")

    ftp.quit()
    print(f"--- subidos OK: {ok} | fallos: {fail} ---")
    print(f"Verifica: https://fullscreencode.com/{REMOTE_DIR}/")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
