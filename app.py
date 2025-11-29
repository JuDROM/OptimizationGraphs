# run.py
import os
import sys
import subprocess
import platform
import time

ROOT = os.path.dirname(os.path.abspath(__file__))

def run(cmd, cwd=None, shell=False):
    print(f"> {cmd} (cwd={cwd or os.getcwd()})")
    res = subprocess.run(cmd, shell=shell, cwd=cwd)
    if res.returncode != 0:
        print("Comando devolvió código de error:", res.returncode)
        sys.exit(res.returncode)

def ensure_backend_venv():
    venv_path = os.path.join(ROOT, "backend", "venv")
    python_bin = sys.executable
    if not os.path.exists(venv_path):
        print("Creando entorno virtual para backend...")
        run([python_bin, "-m", "venv", "venv"], cwd=os.path.join(ROOT, "backend"))
    # pip path
    if platform.system() == "Windows":
        pip = os.path.join(venv_path, "Scripts", "pip.exe")
        python = os.path.join(venv_path, "Scripts", "python.exe")
    else:
        pip = os.path.join(venv_path, "bin", "pip")
        python = os.path.join(venv_path, "bin", "python")
    print("Instalando dependencias Python...")
    run([pip, "install", "-r", "requirements.txt"], cwd=os.path.join(ROOT, "backend"))
    return python

def ensure_frontend_deps():
    frontend_dir = os.path.join(ROOT, "frontend")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("Instalando dependencias frontend (npm install)...")
        run(["npm", "install"], cwd=frontend_dir)
    else:
        print("node_modules ya existe, omitiendo npm install")
    return frontend_dir

def start_backend(python_bin):
    print("Iniciando backend (Flask) en puerto 5000...")
    # Arrancar en segundo plano
    backend_script = os.path.join("backend", "main.py")
    if platform.system() == "Windows":
        # Windows: crear nuevo proceso
        subprocess.Popen([python_bin, backend_script], cwd=ROOT, creationflags=0x00000008)
    else:
        subprocess.Popen([python_bin, backend_script], cwd=ROOT)
    # esperar un poco a que arranque
    time.sleep(1)

def start_frontend(frontend_dir):
    print("Iniciando frontend (Vite) en puerto 5173...")
    # Abrir npm run dev en nuevo proceso
    if platform.system() == "Windows":
        subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir, shell=True, creationflags=0x00000008)
    else:
        subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir)
    time.sleep(1)

if __name__ == "__main__":
    print("=== Iniciando setup del proyecto ===")
    python_bin = ensure_backend_venv()
    frontend_dir = ensure_frontend_deps()
    start_backend(python_bin)
    start_frontend(frontend_dir)
    print("\n✅ Proyecto ejecutándose.")
    print(" - Backend: http://127.0.0.1:5000")
    print(" - Frontend: http://127.0.0.1:5173")
    print("\nPresiona Ctrl+C en la terminal para detener ambos procesos (si los iniciaste aquí).")