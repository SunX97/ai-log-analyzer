# Fast Large Log File Generator (80MB)

Write-Host "Generating large log file (target: 80MB)..." -ForegroundColor Green

$outputFile = "C:\Users\sun3w\ai-log-analyzer\large-production-logs.log"
$targetSizeBytes = 80 * 1024 * 1024  # 80MB

# Pre-generate log entry templates for faster processing
$logEntries = @()

Write-Host "Preparing log templates..." -ForegroundColor Yellow

# Generate base timestamp patterns
$baseDate = Get-Date "2024-08-30 00:00:00"

# Create 1000 unique log entry templates
for ($i = 0; $i -lt 1000; $i++) {
    $timestamp = $baseDate.AddMinutes($i * 2 + (Get-Random -Min 0 -Max 120))
    $timestampStr = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
    
    $entries = @(
        "$timestampStr INFO [UserService] User login successful: user_id=$(Get-Random -Min 10000 -Max 99999), ip=192.168.1.$(Get-Random -Min 1 -Max 254)",
        "$timestampStr INFO [OrderService] Order created: order_id=ORD-2024-$(Get-Random -Min 100000 -Max 999999), user_id=$(Get-Random -Min 10000 -Max 99999), total=$$(Get-Random -Min 10 -Max 2000).$(Get-Random -Min 10 -Max 99)",
        "$timestampStr ERROR [DatabaseService] Connection timeout: Unable to connect to database server db-$(Get-Random -Min 1 -Max 10).company.com:5432",
        "$timestampStr WARN [SecurityService] Failed login attempt: ip=203.0.113.$(Get-Random -Min 1 -Max 254), user=admin, attempts=$(Get-Random -Min 1 -Max 10)",
        "$timestampStr INFO [PaymentService] Payment processed: transaction_id=TXN-$(Get-Random -Min 100000 -Max 999999), amount=$$(Get-Random -Min 10 -Max 1000).$(Get-Random -Min 10 -Max 99)",
        "$timestampStr ERROR [PaymentService] Payment failed: order_id=ORD-2024-$(Get-Random -Min 100000 -Max 999999), reason=insufficient_funds, amount=$$(Get-Random -Min 50 -Max 500).$(Get-Random -Min 10 -Max 99)",
        "$timestampStr WARN [SystemMonitor] High CPU usage: server=app-$(Get-Random -Min 1 -Max 20), usage=$(Get-Random -Min 85 -Max 99)%, threshold=85%",
        "$timestampStr DEBUG [CacheService] Cache miss: key=user_profile_$(Get-Random -Min 10000 -Max 99999), fetching from database, latency=$(Get-Random -Min 5 -Max 50)ms",
        "$timestampStr ERROR [APIGateway] Rate limit exceeded: client_ip=198.51.100.$(Get-Random -Min 1 -Max 254), endpoint=/api/products, requests=$(Get-Random -Min 1000 -Max 5000)/hour",
        "$timestampStr INFO [ProductService] Product search: query='$(('smartphones','laptops','tablets','headphones','cameras') | Get-Random)', results=$(Get-Random -Min 10 -Max 1000), response_time=$(Get-Random -Min 50 -Max 500)ms",
        "$timestampStr WARN [LoadBalancer] Server health check failed: server=web-$(Get-Random -Min 1 -Max 15), response_time=timeout, removing from pool",
        "$timestampStr ERROR [EmailService] Email delivery failed: recipient=$(('john','jane','bob','alice','mike','sarah') | Get-Random)@$(('gmail','company','business') | Get-Random).com, smtp_error=connection_refused",
        "$timestampStr INFO [InventoryService] Stock updated: product_id=$(('PHONE','LAPTOP','TABLET','WATCH','CAMERA') | Get-Random)-$(Get-Random -Min 100 -Max 999), quantity=$(Get-Random -Min 0 -Max 100)",
        "$timestampStr ERROR [BackupService] Backup failed: destination=s3://backups/production/$(Get-Date -Format 'yyyy-MM-dd'), error=access_denied, retry_in=$(Get-Random -Min 300 -Max 1800)s",
        "$timestampStr WARN [SecurityService] Potential DDoS attack: source_ip=203.0.113.$(Get-Random -Min 1 -Max 254), requests_per_second=$(Get-Random -Min 1000 -Max 5000), blocked=true",
        "$timestampStr INFO [NotificationService] Push notification sent: user_id=$(Get-Random -Min 10000 -Max 99999), message='Order shipped', delivery_status=success",
        "$timestampStr ERROR [FileUploadService] File upload rejected: filename=$(('document','image','video','audio') | Get-Random).$(('pdf','jpg','mp4','mp3') | Get-Random), size=$(Get-Random -Min 50 -Max 200)MB, max_allowed=100MB",
        "$timestampStr DEBUG [PerformanceMonitor] Response time measured: endpoint=/api/checkout, avg_time=$(Get-Random -Min 200 -Max 2000)ms, samples=$(Get-Random -Min 100 -Max 1000)",
        "$timestampStr WARN [DatabaseService] Slow query detected: execution_time=$(Get-Random -Min 2 -Max 10).$(Get-Random -Min 0 -Max 9)s, table=$(('users','orders','products','inventory') | Get-Random), action=optimize_recommended",
        "$timestampStr ERROR [IntegrationService] Third-party API failure: service=$(('shipping','payment','analytics','crm') | Get-Random)_api, status_code=$(Get-Random -Min 500 -Max 599), retry_after=$(Get-Random -Min 60 -Max 600)s",
        "$timestampStr INFO [AuditService] Admin action logged: user=admin@company.com, action=$(('user_delete','permission_change','config_update') | Get-Random), target_id=$(Get-Random -Min 1000 -Max 9999)",
        "$timestampStr ERROR [ValidationService] Data validation failed: record_id=$(Get-Random -Min 100000 -Max 999999), field=$(('email','phone','address') | Get-Random), error=invalid_format",
        "$timestampStr WARN [InventoryService] Low stock alert: product_id=$(('PHONE','LAPTOP','TABLET') | Get-Random)-$(Get-Random -Min 100 -Max 999), current_stock=$(Get-Random -Min 1 -Max 10), reorder_threshold=20",
        "$timestampStr INFO [SearchService] Search index updated: documents_added=$(Get-Random -Min 100 -Max 1000), documents_removed=$(Get-Random -Min 10 -Max 100), index_size=$(Get-Random -Min 1 -Max 50)GB",
        "$timestampStr ERROR [SessionService] Session cleanup failed: expired_sessions=$(Get-Random -Min 10000 -Max 100000), error=database_lock_timeout, cleanup_delayed=true",
        "$timestampStr DEBUG [MetricsCollector] Hourly metrics: active_users=$(Get-Random -Min 1000 -Max 10000), page_views=$(Get-Random -Min 50000 -Max 500000), api_calls=$(Get-Random -Min 100000 -Max 1000000)",
        "$timestampStr WARN [CDNService] Cache invalidation required: region=us-east-1, affected_files=$(Get-Random -Min 1000 -Max 10000), estimated_time=$(Get-Random -Min 5 -Max 30)minutes",
        "$timestampStr ERROR [ConfigService] Configuration validation error: config_file=production.json, invalid_setting=$(('database.timeout','redis.maxmemory','nginx.worker_processes') | Get-Random)",
        "$timestampStr INFO [RecommendationService] ML model updated: model=product_recommendations_v$(Get-Random -Min 1 -Max 5).$(Get-Random -Min 0 -Max 9), accuracy=$(Get-Random -Min 85 -Max 99).$(Get-Random -Min 0 -Max 9)%",
        "$timestampStr ERROR [LoggingService] Log rotation failed: log_file=/var/log/application.log, size=$(Get-Random -Min 5 -Max 20)GB, disk_space_insufficient=true"
    )
    
    $logEntries += $entries
}

Write-Host "Generated $($logEntries.Count) unique log templates" -ForegroundColor Cyan
Write-Host "Writing to file..." -ForegroundColor Yellow

# Clear the output file
"" | Out-File -FilePath $outputFile -Encoding UTF8

$currentSize = 0
$entryCount = 0
$batchSize = 1000
$batch = @()

while ($currentSize -lt $targetSizeBytes) {
    # Add random entries to batch
    for ($i = 0; $i -lt $batchSize -and $currentSize -lt $targetSizeBytes; $i++) {
        $randomEntry = $logEntries | Get-Random
        $batch += $randomEntry
        $entryCount++
        
        # Estimate size (approximate)
        $currentSize += $randomEntry.Length + 2  # +2 for line ending
    }
    
    # Write batch to file
    $batch | Add-Content -Path $outputFile -Encoding UTF8
    
    # Clear batch
    $batch = @()
    
    # Update progress
    $sizeMB = [math]::Round($currentSize / 1MB, 2)
    $progress = [math]::Round(($currentSize / $targetSizeBytes) * 100, 1)
    Write-Host "Generated $entryCount entries, Size: $sizeMB MB ($progress%)" -ForegroundColor Cyan
    
    # Get actual file size for accuracy
    if (Test-Path $outputFile) {
        $actualSize = (Get-Item $outputFile).Length
        if ($actualSize -gt $currentSize) {
            $currentSize = $actualSize
        }
    }
}

# Final statistics
$finalActualSize = (Get-Item $outputFile).Length
$finalSizeMB = [math]::Round($finalActualSize / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Large Log File Generated Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "File: large-production-logs.log" -ForegroundColor White
Write-Host "Location: $outputFile" -ForegroundColor White
Write-Host "Total entries: $entryCount" -ForegroundColor White
Write-Host "Final size: $finalSizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "This file contains:" -ForegroundColor Yellow
Write-Host "- User authentication events" -ForegroundColor White
Write-Host "- Database connection issues" -ForegroundColor White
Write-Host "- Payment processing logs" -ForegroundColor White
Write-Host "- Security incidents" -ForegroundColor White
Write-Host "- System performance alerts" -ForegroundColor White
Write-Host "- API rate limiting events" -ForegroundColor White
Write-Host "- File upload/processing errors" -ForegroundColor White
Write-Host "- Service integration failures" -ForegroundColor White
Write-Host ""
Write-Host "Ready to test your AI Log Analyzer with large-scale data!" -ForegroundColor Green
