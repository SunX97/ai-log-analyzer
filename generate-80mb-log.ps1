# Generate 80MB Log File Efficiently

$outputFile = "C:\Users\sun3w\ai-log-analyzer\large-production-logs.log"
$targetSizeBytes = 80 * 1024 * 1024  # 80MB

Write-Host "Generating 80MB log file..." -ForegroundColor Green

# Base log entries to repeat with variations
$baseEntries = @(
    "INFO [UserService] User login successful: user_id={0}, ip=192.168.1.{1}",
    "ERROR [DatabaseService] Connection timeout: Unable to connect to primary database server db-{0}",
    "WARN [SecurityService] Multiple failed login attempts: ip=203.0.113.{0}, attempts={1}",
    "INFO [OrderService] Order created: order_id=ORD-2024-{0}, user_id={1}, total=${2}.{3}",
    "ERROR [PaymentService] Payment declined: order_id=ORD-2024-{0}, reason=insufficient_funds",
    "WARN [SystemMonitor] High CPU usage detected: cpu_usage={0}%, threshold=85%",
    "DEBUG [CacheService] Cache miss: key=user_profile_{0}, fetching from database",
    "ERROR [APIGateway] Rate limit exceeded: client_ip=198.51.100.{0}, endpoint=/api/products",
    "INFO [ProductService] Product search: query='smartphones', results={0}",
    "WARN [LoadBalancer] Server health check failed: server=app-server-{0}",
    "ERROR [EmailService] Email delivery failed: recipient=user{0}@company.com",
    "INFO [InventoryService] Stock updated: product_id=PHONE-{0}, quantity={1}",
    "ERROR [BackupService] Backup failed: destination=s3://backups/prod/{0}",
    "WARN [SecurityService] Potential DDoS attack: source_ip=203.0.113.{0}",
    "INFO [NotificationService] Push notification sent: user_id={0}",
    "ERROR [FileUploadService] File upload rejected: filename=image{0}.jpg, size={1}MB"
)

# Clear output file
"" | Out-File -FilePath $outputFile -Encoding UTF8

$entryCount = 0
$currentSize = 0
$batchLines = @()
$batchSize = 5000

Write-Host "Generating entries..." -ForegroundColor Yellow

while ($currentSize -lt $targetSizeBytes) {
    for ($i = 0; $i -lt $batchSize -and $currentSize -lt $targetSizeBytes; $i++) {
        # Generate timestamp (last 30 days)
        $randomMinutes = Get-Random -Min 0 -Max 43200  # 30 days worth of minutes
        $timestamp = (Get-Date).AddMinutes(-$randomMinutes).ToString("yyyy-MM-dd HH:mm:ss")
        
        # Select random log template
        $template = $baseEntries | Get-Random
        
        # Generate random numbers for placeholders
        $num1 = Get-Random -Min 1 -Max 99999
        $num2 = Get-Random -Min 1 -Max 255
        $num3 = Get-Random -Min 10 -Max 1999
        $num4 = Get-Random -Min 10 -Max 99
        
        # Format the log entry
        $logEntry = "$timestamp $($template -f $num1, $num2, $num3, $num4)"
        $batchLines += $logEntry
        
        $entryCount++
        $currentSize += $logEntry.Length + 2  # Estimate with line breaks
    }
    
    # Write batch to file
    $batchLines | Add-Content -Path $outputFile -Encoding UTF8
    $batchLines = @()
    
    # Check actual file size
    if (Test-Path $outputFile) {
        $actualSize = (Get-Item $outputFile).Length
        $currentSize = $actualSize
    }
    
    # Progress update
    $sizeMB = [math]::Round($currentSize / 1MB, 2)
    $progress = [math]::Round(($currentSize / $targetSizeBytes) * 100, 1)
    Write-Host "Entries: $entryCount | Size: $sizeMB MB ($progress%)" -ForegroundColor Cyan
}

# Final stats
$finalSize = (Get-Item $outputFile).Length
$finalSizeMB = [math]::Round($finalSize / 1MB, 2)

Write-Host ""
Write-Host "File generated successfully!" -ForegroundColor Green
Write-Host "Location: $outputFile" -ForegroundColor White  
Write-Host "Size: $finalSizeMB MB" -ForegroundColor White
Write-Host "Entries: $entryCount" -ForegroundColor White
