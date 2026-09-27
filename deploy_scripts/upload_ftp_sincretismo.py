# -*- coding: utf-8 -*-
"""
Sube el frontend estatico de Sincretismo de Silicio al FTP de Ferozo.

Uso:
    python deploy_scripts/upload_ftp_sincretismo.py

Destino: /public_html/sincretismodesilicio/
   -> https://fullscreencode.com/sincretismodesilicio/

Credenciales (en orden de precedencia):
  1. Variables de entorno FTP_HOST / FTP_USER / FTP_PASS
  2. FileZilla sitemanager.xml (entrada con c1700065.ferozo.com)  <- fuente vigente
  3. .env del proyecto / megaskill/.env

⚠️ OJO — limitacion conocida del host estatico:
El frontend llama a /api/* y /config. En el FTP (Apache, sin backend) esas rutas
NO existen, asi que:
  - Config: cae a defaults / localStorage (no rompe).
  - Guardar config: avisa que no hay servidor; el resto (colores, shader) se
    persiste en localStorage.
Por eso public/js/base-path.js apunta la API al VPS cuando detecta hosting
estatico (con respaldo a la raiz del VPS), y los MODELOS siempre se piden al
Ollama local del visitante.
"""
import base64
import ftplib
import io
import os
import pathlib
import re
import ssl
import sys

PROJECT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = PROJECT / "public"
REMOTE_DIR = "public_html/sincretismodesilicio"
CRED_SOURCES = [PROJECT / ".env", PROJECT.parent / "sistemasfullscreen" / "megaskill" / ".env"]
SKIP_NAMES = {".htaccess", ".DS_Store"}


def from_env_vars() -> dict:
    cfg = {}
    for k in ("FTP_HOST", "FTP_USER", "FTP_PASS"):
        if os.environ.get(k):
            cfg[k] = os.environ[k]
    return cfg


def from_filezilla() -> dict:
    """Credencial vigente del hosting Ferozo (c1700065)."""
    path = pathlib.Path(os.environ.get("APPDATA", "")) / "FileZilla" / "sitemanager.xml"
    if not path.exists():
        return {}
    txt = path.read_text(encoding="utf-8", errors="ignore")
    for blk in re.findall(r"<Server>(.*?)</Server>", txt, re.S):
        if "c1700065.ferozo.com" not in blk:
            continue
        user = re.search(r"<User>(.*?)</User>", blk)
        pw = re.search(r"<Pass[^>]*>(.*?)</Pass>", blk)
        enc = re.search(r"<Pass[^>]*encoding=\"([^\"]+)\"", blk)
        password = ""
        if pw and pw.group(1):
            if enc and enc.group(1) == "base64":
                password = base64.b64decode(pw.group(1)).decode("utf-8", "ignore")
            else:
                password = pw.group(1)
        return {"FTP_HOST": "c1700065.ferozo.com",
                "FTP_USER": user.group(1) if user else "c1700065",
                "FTP_PASS": password}
    return {}


def from_dotenvs() -> dict:
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
            if k.startswith("FTP_"):
                cfg.setdefault(k, v)
    return cfg


def resolve_creds() -> dict:
    for source in (from_env_vars, from_filezilla, from_dotenvs):
        cfg = source()
        if cfg.get("FTP_HOST") and cfg.get("FTP_USER") and cfg.get("FTP_PASS"):
            return cfg
    return {}


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


def walk() -> list:
    out = []
    for f in sorted(PUBLIC.rglob("*")):
        if f.is_file() and f.name not in SKIP_NAMES and not f.name.startswith("."):
            out.append((f, f.relative_to(PUBLIC).as_posix()))
    return out


def main() -> int:
    cfg = resolve_creds()
    if not cfg:
        print("Faltan credenciales FTP (env vars, FileZilla o .env del proyecto).")
        return 1
    print(f"FTP {cfg['FTP_USER']}@{cfg['FTP_HOST']}  ->  /{REMOTE_DIR}/")

    files = walk()
    print(f"{len(files)} archivos a subir")

    try:
        ftp = connect(cfg)
    except ftplib.error_perm as e:
        print(f"LOGIN RECHAZADO: {e}")
        print("Revisar la password vigente del panel de Ferozo / FileZilla.")
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
    print(f"Verifica: https://fullscreencode.com/{REMOTE_DIR.split('/', 1)[1]}/")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
