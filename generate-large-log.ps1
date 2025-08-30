# Generate Large Log File (80MB) for AI Log Analyzer Testing

Write-Host "Generating large log file (target: 80MB)..." -ForegroundColor Green

$outputFile = "C:\Users\sun3w\ai-log-analyzer\large-application-logs.log"
$targetSizeBytes = 80 * 1024 * 1024  # 80MB

# Define log templates with various scenarios
$logTemplates = @(
    @{ Level = "INFO"; Service = "UserService"; Messages = @(
        "User login successful: user_id={0}, ip={1}",
        "User logout: user_id={0}, session_duration={1}m{2}s",
        "User registration: email={0}@{1}.com, user_id={2}",
        "Password changed: user_id={0}, security_question_updated={1}",
        "User profile updated: user_id={0}, fields=[{1}]",
        "Account verification completed: user_id={0}, email_verified=true",
        "Two-factor authentication enabled: user_id={0}, method={1}",
        "Loyalty points awarded: user_id={0}, points={1}, total_balance={2}"
    )},
    @{ Level = "ERROR"; Service = "DatabaseService"; Messages = @(
        "Connection timeout: Unable to connect to primary database server (db-primary-{0:D2})",
        "Deadlock detected: table={0}, query_1={1}, query_2={2}",
        "Replication lag detected: master_db=primary, slave_lag={0}_seconds",
        "Table lock timeout: table={0}, operation={1}, timeout={2}s",
        "Connection pool exhausted: active_connections={0}, max_connections={0}",
        "Index fragmentation detected: table={0}, fragmentation={1}%",
        "Query execution timeout: query={0}, timeout_after={1}s"
    )},
    @{ Level = "WARN"; Service = "SecurityService"; Messages = @(
        "Multiple failed login attempts: ip={0}, attempts={1}, user={2}",
        "Potential brute force attack detected: ip={0}, blocked for {1} minutes",
        "Suspicious activity detected: user_id={0}, rapid_requests={1}/minute",
        "API key near expiration: key_id=API-KEY-{0}, expires_in={1}_days",
        "Unusual login location: user_id={0}, location={1}, previous={2}",
        "Rate limit warning: client_id={0}, usage={1}%, limit={2}/hour"
    )},
    @{ Level = "ERROR"; Service = "PaymentService"; Messages = @(
        "Payment declined: order_id=ORD-2024-{0:D6}, reason={1}",
        "Webhook verification failed: source={0}, signature_mismatch=true",
        "Credit card processor downtime: processor={0}, estimated_recovery={1}_minutes",
        "Fraud detection service timeout: provider={0}, timeout={1}s",
        "Transaction rollback: transaction_id=TXN-{0}, reason={1}"
    )},
    @{ Level = "INFO"; Service = "OrderService"; Messages = @(
        "Order created: order_id=ORD-2024-{0:D6}, user_id={1}, total=${2}",
        "Order status updated: order_id=ORD-2024-{0:D6}, status={1}",
        "Order cancelled: order_id=ORD-2024-{0:D6}, reason={1}, refund_amount=${2}",
        "Order delivered: order_id=ORD-2024-{0:D6}, delivery_time={1}_days, rating={2}_stars",
        "Bulk order processed: orders_count={0}, total_value=${1}",
        "Return processed: order_id=ORD-2024-{0:D6}, refund_amount=${1}, reason={2}"
    )},
    @{ Level = "WARN"; Service = "SystemMonitor"; Messages = @(
        "High CPU usage detected: cpu_usage={0}%, threshold=85%",
        "Memory usage warning: memory_usage={0}%, available={1}GB",
        "Disk space warning: partition={0}, usage={1}%, available={2}MB",
        "Network latency spike: avg_latency={0}ms, normal_range=50-100ms",
        "Temperature alert: server=app-server-{0:D2}, cpu_temp={1}°C, threshold=75°C",
        "High error rate detected: errors_per_minute={0}, threshold=20"
    )},
    @{ Level = "ERROR"; Service = "ExternalAPIService"; Messages = @(
        "Third-party service unavailable: {0}_api, status={1}, retry_in={2}s",
        "API quota exceeded: service={0}, requests={1}/day, limit={2}/day",
        "Authentication failed: service={0}, error={1}",
        "Service timeout: endpoint={0}, timeout_after={1}s, retry_count={2}"
    )},
    @{ Level = "DEBUG"; Service = "CacheService"; Messages = @(
        "Cache miss: key={0}, fetching from database",
        "Cache cleanup completed: expired_keys={0}, memory_freed={1}MB",
        "Cache hit rate: {0}%, misses={1}, hits={2}, efficiency=optimal",
        "Cache warming completed: warmed_keys={0}, cache_efficiency=improved"
    )},
    @{ Level = "INFO"; Service = "ProductService"; Messages = @(
        "Product search: query='{0}', results={1}",
        "Product added to cart: user_id={0}, product_id={1}, quantity={2}",
        "Product view: product_id={0}, user_id={1}",
        "Product review submitted: product_id={0}, user_id={1}, rating={2}",
        "Product catalog sync completed: products_updated={0}, sync_time={1}s"
    )},
    @{ Level = "ERROR"; Service = "FileService"; Messages = @(
        "File upload failed: filename={0}, size={1}MB, max_size={2}MB",
        "Virus detected in upload: filename={0}, action=quarantined",
        "Storage quota exceeded: current_usage={0}%, limit={1}TB, action=cleanup_required",
        "File corruption detected: file_id={0}, checksum_mismatch=true"
    )}
)

# Sample data for placeholders
$userIds = 12345..12999
$ipAddresses = @("192.168.1.100", "10.0.0.25", "203.0.113.45", "198.51.100.23", "172.16.0.15", "203.0.113.67", "10.1.1.50")
$productIds = @("PHONE-001", "LAPTOP-005", "TABLET-003", "HEADPHONES-007", "WATCH-099", "CAMERA-012", "SPEAKER-008")
$emailDomains = @("email", "gmail", "company", "business", "tech", "startup")
$userNames = @("john.doe", "jane.smith", "bob.wilson", "alice.brown", "mike.jones", "sarah.davis")
$paymentReasons = @("insufficient_funds", "expired_card", "fraud_suspected", "bank_declined", "invalid_cvv")
$orderStatuses = @("pending", "processing", "shipped", "delivered", "cancelled")
$apiServices = @("shipping", "payment", "inventory", "analytics", "notification", "recommendation")
$searchQueries = @("smartphones", "laptops", "headphones", "tablets", "watches", "cameras", "accessories")

# Function to get random timestamp in the last 30 days
function Get-RandomTimestamp {
    $startDate = (Get-Date).AddDays(-30)
    $endDate = Get-Date
    $randomTicks = Get-Random -Minimum $startDate.Ticks -Maximum $endDate.Ticks
    return (New-Object DateTime($randomTicks)).ToString("yyyy-MM-dd HH:mm:ss")
}

# Function to get random item from array
function Get-RandomItem($array) {
    return $array | Get-Random
}

Write-Host "Starting log generation..." -ForegroundColor Yellow
$currentSize = 0
$entryCount = 0
$startTime = Get-Date

# Create or clear the output file
"" | Out-File -FilePath $outputFile -Encoding UTF8

while ($currentSize -lt $targetSizeBytes) {
    # Select random log template
    $template = Get-RandomItem $logTemplates
    $message = Get-RandomItem $template.Messages
    
    # Generate random data for placeholders
    $timestamp = Get-RandomTimestamp
    $level = $template.Level
    $service = $template.Service
    
    # Fill in message placeholders with random data
    $formattedMessage = $message
    try {
        switch ($service) {
            "UserService" {
                $userId = Get-RandomItem $userIds
                $ip = Get-RandomItem $ipAddresses
                $userName = Get-RandomItem $userNames
                $domain = Get-RandomItem $emailDomains
                $duration1 = Get-Random -Min 1 -Max 60
                $duration2 = Get-Random -Min 1 -Max 59
                $field = Get-RandomItem @("phone", "address", "preferences", "avatar")
                $points = Get-Random -Min 10 -Max 500
                $balance = Get-Random -Min 100 -Max 5000
                $method = Get-RandomItem @("sms", "email", "authenticator_app")
                
                $formattedMessage = $message -f $userId, $ip, $userName, $domain, $duration1, $duration2, $field, $points, $balance, $method
            }
            "DatabaseService" {
                $serverNum = Get-Random -Min 1 -Max 5
                $table = Get-RandomItem @("users", "orders", "products", "sessions", "inventory", "payments")
                $operation = Get-RandomItem @("SELECT", "UPDATE", "DELETE", "INSERT")
                $timeout = Get-Random -Min 30 -Max 300
                $lag = Get-Random -Min 10 -Max 120
                $fragmentation = Get-Random -Min 50 -Max 95
                $connections = Get-Random -Min 180 -Max 250
                
                $formattedMessage = $message -f $serverNum, $table, $operation, $timeout, $lag, $fragmentation, $connections
            }
            "SecurityService" {
                $ip = Get-RandomItem $ipAddresses
                $attempts = Get-Random -Min 3 -Max 10
                $user = Get-RandomItem @("admin", "user", "guest")
                $minutes = Get-Random -Min 5 -Max 60
                $userId = Get-RandomItem $userIds
                $requests = Get-Random -Min 100 -Max 300
                $keyNum = Get-Random -Min 100 -Max 999
                $days = Get-Random -Min 1 -Max 30
                $location1 = Get-RandomItem @("Tokyo", "London", "Paris", "Sydney", "Mumbai")
                $location2 = Get-RandomItem @("New_York", "Los_Angeles", "Chicago", "Miami", "Seattle")
                $clientId = Get-RandomItem @("mobile_app_v2.1", "web_client", "api_client")
                $usage = Get-Random -Min 70 -Max 99
                $limit = Get-Random -Min 5000 -Max 15000
                
                $formattedMessage = $message -f $ip, $attempts, $user, $minutes, $userId, $requests, $keyNum, $days, $location1, $location2, $clientId, $usage, $limit
            }
            "PaymentService" {
                $orderNum = Get-Random -Min 1 -Max 999999
                $reason = Get-RandomItem $paymentReasons
                $processor = Get-RandomItem @("stripe", "paypal", "square", "braintree")
                $minutes = Get-Random -Min 15 -Max 120
                $provider = Get-RandomItem @("sift", "fraud_labs", "kount")
                $timeout = Get-Random -Min 5 -Max 30
                $txnId = Get-Random -Min 100000 -Max 999999
                
                $formattedMessage = $message -f $orderNum, $reason, $processor, $minutes, $provider, $timeout, $txnId
            }
            "OrderService" {
                $orderNum = Get-Random -Min 1 -Max 999999
                $userId = Get-RandomItem $userIds
                $total = "{0:F2}" -f (Get-Random -Min 10 -Max 2000)
                $status = Get-RandomItem $orderStatuses
                $reason = Get-RandomItem @("customer_request", "payment_failed", "out_of_stock")
                $refund = "{0:F2}" -f (Get-Random -Min 10 -Max 500)
                $days = Get-Random -Min 1 -Max 7
                $rating = Get-Random -Min 1 -Max 5
                $count = Get-Random -Min 5 -Max 100
                $value = "{0:F2}" -f (Get-Random -Min 1000 -Max 50000)
                
                $formattedMessage = $message -f $orderNum, $userId, $total, $status, $reason, $refund, $days, $rating, $count, $value
            }
            "SystemMonitor" {
                $usage = Get-Random -Min 80 -Max 99
                $available = "{0:F1}" -f (Get-Random -Min 0.5 -Max 8.0)
                $partition = Get-RandomItem @("/var/log", "/tmp", "/home", "/opt")
                $availableMB = Get-Random -Min 100 -Max 2000
                $latency = Get-Random -Min 150 -Max 500
                $serverNum = Get-Random -Min 1 -Max 10
                $temp = Get-Random -Min 76 -Max 90
                $errors = Get-Random -Min 21 -Max 50
                
                $formattedMessage = $message -f $usage, $available, $partition, $availableMB, $latency, $serverNum, $temp, $errors
            }
            "ExternalAPIService" {
                $service = Get-RandomItem $apiServices
                $status = Get-RandomItem @(503, 500, 429, 404, 502)
                $retry = Get-Random -Min 60 -Max 600
                $requests = Get-Random -Min 50000 -Max 200000
                $limit = Get-Random -Min 50000 -Max 150000
                $error = Get-RandomItem @("timeout", "connection_refused", "auth_failed", "rate_limited")
                $timeout = Get-Random -Min 10 -Max 60
                $retryCount = Get-Random -Min 1 -Max 5
                
                $formattedMessage = $message -f $service, $status, $retry, $requests, $limit, $error, $timeout, $retryCount
            }
            "CacheService" {
                $key = Get-RandomItem @("user_profile", "product_details", "search_results", "recommendations")
                $expired = Get-Random -Min 500 -Max 5000
                $freed = Get-Random -Min 50 -Max 500
                $hitRate = Get-Random -Min 80 -Max 99
                $misses = Get-Random -Min 100 -Max 2000
                $hits = Get-Random -Min 5000 -Max 20000
                $warmed = Get-Random -Min 1000 -Max 20000
                
                $formattedMessage = $message -f $key, $expired, $freed, $hitRate, $misses, $hits, $warmed
            }
            "ProductService" {
                $query = Get-RandomItem $searchQueries
                $results = Get-Random -Min 10 -Max 1000
                $userId = Get-RandomItem $userIds
                $productId = Get-RandomItem $productIds
                $quantity = Get-Random -Min 1 -Max 10
                $rating = Get-Random -Min 1 -Max 5
                $updated = Get-Random -Min 100 -Max 5000
                $syncTime = Get-Random -Min 10 -Max 120
                
                $formattedMessage = $message -f $query, $results, $userId, $productId, $quantity, $rating, $updated, $syncTime
            }
            "FileService" {
                $filename = Get-RandomItem @("image.jpg", "document.pdf", "data.csv", "report.xlsx", "suspicious.exe")
                $size = Get-Random -Min 5 -Max 25
                $maxSize = Get-Random -Min 10 -Max 20
                $fileId = "FILE-{0:D6}" -f (Get-Random -Min 1 -Max 999999)
                $usage = Get-Random -Min 95 -Max 99
                $limit = Get-Random -Min 1 -Max 10
                
                $formattedMessage = $message -f $filename, $size, $maxSize, $fileId, $usage, $limit
            }
            default {
                # Generic formatting for other services
                $num1 = Get-Random -Min 1 -Max 1000
                $num2 = Get-Random -Min 1 -Max 100
                $num3 = Get-Random -Min 1 -Max 50
                
                $formattedMessage = $message -f $num1, $num2, $num3
            }
        }
    } catch {
        # If formatting fails, use original message
        $formattedMessage = $message
    }
    
    # Create log entry
    $logEntry = "$timestamp $level [$service] $formattedMessage"
    
    # Write to file
    Add-Content -Path $outputFile -Value $logEntry -Encoding UTF8
    
    # Update counters
    $entryCount++
    $currentSize = (Get-Item $outputFile).Length
    
    # Progress update every 10000 entries
    if ($entryCount % 10000 -eq 0) {
        $sizeMB = [math]::Round($currentSize / 1MB, 2)
        $progress = [math]::Round(($currentSize / $targetSizeBytes) * 100, 1)
        Write-Host "Generated $entryCount entries, Size: $sizeMB MB ($progress%)" -ForegroundColor Cyan
    }
    
    # Add some random variation in timing
    if ($entryCount % 1000 -eq 0) {
        Start-Sleep -Milliseconds 1
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime
$finalSize = [math]::Round((Get-Item $outputFile).Length / 1MB, 2)

Write-Host ""
Write-Host "Log file generation completed!" -ForegroundColor Green
Write-Host "File: $outputFile" -ForegroundColor White
Write-Host "Total entries: $entryCount" -ForegroundColor White
Write-Host "Final size: $finalSize MB" -ForegroundColor White
Write-Host "Generation time: $($duration.TotalSeconds.ToString('F1')) seconds" -ForegroundColor White
Write-Host ""
Write-Host "Ready to upload to your AI Log Analyzer!" -ForegroundColor Yellow
