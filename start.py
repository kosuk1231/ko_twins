"""Desktop preview only. iPhone/iPad installation requires an HTTPS deployment."""
import http.server
from pathlib import Path
import os
import webbrowser
os.chdir(Path(__file__).resolve().parent)
port=8765
url=f"http://localhost:{port}/"
print("Word Garden desktop preview:", url)
print("Ctrl+C to stop. For iPhone installation, deploy these files over HTTPS.")
webbrowser.open(url)
try:
    http.server.ThreadingHTTPServer(("127.0.0.1",port),http.server.SimpleHTTPRequestHandler).serve_forever()
except KeyboardInterrupt:
    pass
