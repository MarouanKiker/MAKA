param(
    [string]$OutputDir = ".\performance\exports",
    [string]$ElasticsearchUrl = "http://localhost:9200",
    [string]$PrometheusUrl = "http://localhost:9090",
    [string]$IndexPattern = "maka-logs-*"
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$root = Resolve-Path "."
$exportRoot = Join-Path $root $OutputDir
$elasticDir = Join-Path $exportRoot "elasticsearch"
$promDir = Join-Path $exportRoot "prometheus"

New-Item -ItemType Directory -Force -Path $elasticDir | Out-Null
New-Item -ItemType Directory -Force -Path $promDir | Out-Null

$logsQuery = @{
    size = 200
    sort = @(
        @{
            "@timestamp" = @{
                order = "desc"
                unmapped_type = "date"
            }
        }
    )
    query = @{
        match_all = @{}
    }
} | ConvertTo-Json -Depth 10

$logsPath = Join-Path $elasticDir "maka-logs-$timestamp.json"
Write-Host "[INFO] Export Elasticsearch logs -> $logsPath"
Invoke-RestMethod `
    -Method Post `
    -Uri "$ElasticsearchUrl/$IndexPattern/_search" `
    -ContentType "application/json" `
    -Body $logsQuery `
    -TimeoutSec 10 |
    ConvertTo-Json -Depth 20 |
    Set-Content -Encoding UTF8 $logsPath

$queries = @{
    "targets-up" = "up"
    "http-rate" = "sum(rate(http_server_requests_seconds_count[5m])) by (job, status)"
    "container-cpu" = "maka_container_cpu_percent{service!=''}"
    "container-memory" = "maka_container_memory_usage_bytes{service!=''}"
    "service-availability" = "probe_success{job='service-availability'}"
    "service-response-time" = "probe_duration_seconds{job='service-availability'}"
}

foreach ($entry in $queries.GetEnumerator()) {
    $encodedQuery = [uri]::EscapeDataString($entry.Value)
    $targetPath = Join-Path $promDir "$($entry.Key)-$timestamp.json"
    Write-Host "[INFO] Export Prometheus $($entry.Key) -> $targetPath"
    Invoke-RestMethod -Uri "$PrometheusUrl/api/v1/query?query=$encodedQuery" -TimeoutSec 10 |
        ConvertTo-Json -Depth 20 |
        Set-Content -Encoding UTF8 $targetPath
}

Write-Host "[OK] Exports crees dans $exportRoot"
