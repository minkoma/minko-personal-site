"""Start a persistent, localhost-only preview rooted at this website folder."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parent
MARKER = b"minko-personal-site-preview-v1"

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/__preview_health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(MARKER)
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

def ready(port):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/__preview_health", timeout=1) as response:
            return response.read() == MARKER
    except Exception:
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", type=int)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()
    if args.serve:
        ThreadingHTTPServer(("127.0.0.1", args.serve), partial(Handler, directory=str(ROOT))).serve_forever()
        return
    for port in range(8000, 8010):
        if not ready(port):
            log_path = Path(tempfile.gettempdir()) / f"minko-preview-{port}.log"
            with log_path.open("ab") as log:
                process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "--serve", str(port)],
                    stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
            for _ in range(20):
                if ready(port) or process.poll() is not None:
                    break
                time.sleep(0.1)
        if ready(port):
            url = f"http://127.0.0.1:{port}/index.html"
            print(url, flush=True)
            if not args.no_open:
                subprocess.run(["open", url], check=True)
            return
    raise SystemExit("Ports 8000–8009 are occupied. Close an unused local server and try again.")

if __name__ == "__main__":
    main()
