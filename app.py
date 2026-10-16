import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_LOCK_FILE = os.path.join(PROJECT_DIR, ".next", "dev", "lock")
DEFAULT_PORT = 3000
MAX_PORT_ATTEMPTS = 100


def is_port_listening(port):
    for host in ("127.0.0.1", "::1"):
        family = socket.AF_INET6 if ":" in host else socket.AF_INET
        try:
            with socket.socket(family, socket.SOCK_STREAM) as sock:
                sock.settimeout(0.3)
                if sock.connect_ex((host, port)) == 0:
                    return True
        except OSError:
            continue
    return False


def can_bind(port):
    for family, host in ((socket.AF_INET, "0.0.0.0"), (socket.AF_INET6, "::")):
        if family == socket.AF_INET6 and not socket.has_ipv6:
            continue
        try:
            with socket.socket(family, socket.SOCK_STREAM) as sock:
                # Windows lets a second socket bind an in-use port unless this is set.
                if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                    sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
                sock.bind((host, port))
        except OSError as exc:
            if family == socket.AF_INET6 and (
                getattr(exc, "winerror", None) == 10047 or exc.errno in (97, 47)
            ):
                continue
            return False
    return True


def is_port_free(port):
    return not is_port_listening(port) and can_bind(port)


def find_free_port(start=DEFAULT_PORT):
    for port in range(start, start + MAX_PORT_ATTEMPTS):
        if is_port_free(port):
            return port
    return None


def is_process_running(pid):
    if os.name == "nt":
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/NH", "/FO", "CSV"],
            capture_output=True, text=True,
        )
        return f'"{pid}"' in result.stdout
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def stop_process(pid):
    if os.name == "nt":
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
    else:
        os.kill(pid, signal.SIGTERM)

    for _ in range(50):
        if not is_process_running(pid):
            return True
        time.sleep(0.1)
    return False


def list_windows_node_processes():
    command = (
        "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | "
        "Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json"
    )
    result = subprocess.run(
        ["powershell", "-NoProfile", "-Command", command], capture_output=True, text=True
    )
    try:
        processes = json.loads(result.stdout or "[]")
    except ValueError:
        return []
    return processes if isinstance(processes, list) else [processes]


def find_listening_port(pid):
    result = subprocess.run(["netstat", "-ano", "-p", "TCP"], capture_output=True, text=True)
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) >= 5 and parts[3] == "LISTENING" and parts[4] == str(pid):
            return int(parts[1].rsplit(":", 1)[1])
    return None


def find_windows_dev_server():
    """Next.js holds an exclusive lock on the lock file on Windows, so find the server by process."""
    project = PROJECT_DIR.lower()
    server_script = os.path.join(project, "node_modules", "next", "dist", "server", "lib", "start-server.js")
    processes = list_windows_node_processes()
    by_pid = {p["ProcessId"]: p for p in processes}

    for proc in processes:
        if server_script not in (proc.get("CommandLine") or "").lower():
            continue
        pid = proc["ProcessId"]
        port = find_listening_port(pid)
        # Stop from the parent `next dev` process so it doesn't linger after its server dies.
        parent = by_pid.get(proc.get("ParentProcessId"))
        parent_cmd = (parent or {}).get("CommandLine") or ""
        kill_pid = parent["ProcessId"] if parent and project in parent_cmd.lower() else pid
        return {
            "pid": pid,
            "kill_pid": kill_pid,
            "appUrl": f"http://localhost:{port}" if port else None,
        }
    return None


def get_running_dev_server():
    """Next.js allows only one `next dev` per project and records it in this lock file."""
    if not os.path.exists(DEV_LOCK_FILE):
        return None
    try:
        with open(DEV_LOCK_FILE, encoding="utf-8") as f:
            info = json.load(f)
        pid = int(info["pid"])
    except PermissionError:
        return find_windows_dev_server() if os.name == "nt" else None
    except (OSError, ValueError, KeyError, TypeError):
        return None
    if not is_process_running(pid):
        return None
    info.setdefault("kill_pid", pid)
    return info


def handle_existing_dev_server():
    """Returns True if it's OK to start a new dev server."""
    server = get_running_dev_server()
    if server is None:
        return True

    url = server.get("appUrl") or "an unknown port"
    print(f"\nA dev server for this project is already running at {url} (PID {server['pid']}).")
    answer = input("Stop it and start a new one? [y/N]: ").strip().lower()
    if answer not in ("y", "yes"):
        print(f"Keeping the existing server. Open {url} in your browser.")
        return False

    if not stop_process(int(server["kill_pid"])):
        print(f"Error: could not stop PID {server['kill_pid']}.")
        return False
    print("Existing server stopped.")
    return True


def start_application():
    npm = shutil.which("npm")
    if npm is None:
        print("Error: npm was not found on PATH. Please install Node.js.")
        return

    if not handle_existing_dev_server():
        return

    port = find_free_port()
    if port is None:
        print(f"Error: no free port found between {DEFAULT_PORT} and "
              f"{DEFAULT_PORT + MAX_PORT_ATTEMPTS - 1}.")
        return

    if port != DEFAULT_PORT:
        print(f"Port {DEFAULT_PORT} is busy, using port {port} instead.")

    print(f"Starting application at http://localhost:{port} (press Ctrl+C to stop)...\n")
    try:
        subprocess.run([npm, "run", "dev", "--", "--port", str(port)], cwd=PROJECT_DIR)
    except KeyboardInterrupt:
        print("\nApplication stopped.")


def main():
    while True:
        print("\n===== 3D App Menu =====")
        print("1. Start the application")
        print("2. Exit")
        choice = input("Select an option: ").strip()

        if choice == "1":
            start_application()
        elif choice == "2":
            print("Goodbye!")
            sys.exit(0)
        else:
            print("Invalid option, please choose 1 or 2.")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nGoodbye!")
