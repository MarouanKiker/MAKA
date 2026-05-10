import http.server
import json
import socket
import socketserver
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DOCKER_SOCKET = "/var/run/docker.sock"
PORT = 9108


def docker_get(path):
    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    client.settimeout(3)
    client.connect(DOCKER_SOCKET)
    request = (
        f"GET {path} HTTP/1.1\r\n"
        "Host: docker\r\n"
        "Connection: close\r\n"
        "\r\n"
    ).encode("utf-8")
    client.sendall(request)

    chunks = []
    while True:
        chunk = client.recv(65536)
        if not chunk:
            break
        chunks.append(chunk)
    client.close()

    raw = b"".join(chunks)
    headers, _, body = raw.partition(b"\r\n\r\n")
    if b"transfer-encoding: chunked" in headers.lower():
        body = decode_chunked(body)
    return json.loads(body.decode("utf-8"))


def decode_chunked(body):
    decoded = bytearray()
    position = 0
    while position < len(body):
        line_end = body.find(b"\r\n", position)
        if line_end == -1:
            break
        size_line = body[position:line_end].split(b";", 1)[0]
        size = int(size_line, 16)
        position = line_end + 2
        if size == 0:
            break
        decoded.extend(body[position:position + size])
        position += size + 2
    return bytes(decoded)


def label_value(value):
    return str(value or "").replace("\\", "\\\\").replace('"', '\\"')


def cpu_percent(stats):
    cpu_stats = stats.get("cpu_stats", {})
    precpu_stats = stats.get("precpu_stats", {})

    cpu_total = cpu_stats.get("cpu_usage", {}).get("total_usage", 0)
    precpu_total = precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
    system_total = cpu_stats.get("system_cpu_usage", 0)
    presystem_total = precpu_stats.get("system_cpu_usage", 0)
    online_cpus = cpu_stats.get("online_cpus") or len(cpu_stats.get("cpu_usage", {}).get("percpu_usage", [])) or 1

    cpu_delta = cpu_total - precpu_total
    system_delta = system_total - presystem_total
    if cpu_delta <= 0 or system_delta <= 0:
        return 0.0
    return (cpu_delta / system_delta) * online_cpus * 100.0


def memory_usage(stats):
    memory_stats = stats.get("memory_stats", {})
    usage = memory_stats.get("usage", 0)
    cache = memory_stats.get("stats", {}).get("cache", 0)
    return max(usage - cache, 0)


def collect_metrics():
    containers = docker_get("/containers/json")
    lines = [
        "# HELP maka_container_cpu_percent CPU usage percent by Docker container.",
        "# TYPE maka_container_cpu_percent gauge",
        "# HELP maka_container_memory_usage_bytes Memory usage bytes by Docker container.",
        "# TYPE maka_container_memory_usage_bytes gauge",
        "# HELP maka_container_running Docker container running state.",
        "# TYPE maka_container_running gauge",
    ]

    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = [executor.submit(container_metrics, container) for container in containers]
        for future in as_completed(futures):
            lines.extend(future.result())

    return "\n".join(lines) + "\n"


def container_metrics(container):
    lines = []
    try:
        container_id = container.get("Id", "")
        labels = container.get("Labels", {}) or {}
        names = container.get("Names", []) or []
        fallback_name = names[0].lstrip("/") if names else container_id[:12]
        service = labels.get("com.docker.compose.service") or fallback_name
        project = labels.get("com.docker.compose.project") or ""

        encoded_id = urllib.parse.quote(container_id, safe="")
        stats = docker_get(f"/containers/{encoded_id}/stats?stream=false")

        metric_labels = (
            f'service="{label_value(service)}",'
            f'container="{label_value(fallback_name)}",'
            f'project="{label_value(project)}"'
        )
        lines.append(f"maka_container_cpu_percent{{{metric_labels}}} {cpu_percent(stats):.6f}")
        lines.append(f"maka_container_memory_usage_bytes{{{metric_labels}}} {memory_usage(stats)}")
        lines.append(f"maka_container_running{{{metric_labels}}} 1")
    except Exception as exc:
        fallback_name = (container.get("Names", ["unknown"])[0]).lstrip("/")
        lines.append(
            f'maka_container_scrape_error{{container="{label_value(fallback_name)}",error="{label_value(exc)}"}} 1'
        )
    return lines


class MetricsHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/metrics":
            self.send_response(404)
            self.end_headers()
            return

        try:
            body = collect_metrics().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as exc:
            body = f"exporter_error {label_value(exc)}\n".encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MetricsHandler) as server:
        server.serve_forever()
