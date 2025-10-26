# Test script for RFID Attendance System API endpoints (PowerShell version)
# Run this after starting the development server with: npm run dev

Write-Host "Testing RFID Attendance System API Endpoints" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Test 1: Check if currentTeacher endpoint exists (should return 404 initially)
Write-Host ""
Write-Host "1. Testing /api/currentTeacher (should return 404 - no active teacher)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/currentTeacher" -Headers @{"x-api-key"="supersecret123"} -Method GET
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

# Test 2: Set up a test session (requires teacher data)
Write-Host ""
Write-Host "2. Testing /api/session POST (setting up test session)" -ForegroundColor Yellow
$sessionData = @{
    date = "2025-01-25"
    subject = "IoT"
    timeSlot = "08:45-09:45"
    teacherId = "test-teacher-123"
    teacherEmail = "test@example.com"
    teacherName = "Dr. Test Teacher"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/session" -Headers @{"Content-Type"="application/json"; "x-api-key"="supersecret123"} -Method POST -Body $sessionData
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

# Test 3: Check currentTeacher again (should now return teacher info)
Write-Host ""
Write-Host "3. Testing /api/currentTeacher (should now return teacher info)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/currentTeacher" -Headers @{"x-api-key"="supersecret123"} -Method GET
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

# Test 4: Check activeClass for the teacher
Write-Host ""
Write-Host "4. Testing /api/activeClass (should return session info)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/activeClass?teacherId=test-teacher-123&date=2025-01-25" -Headers @{"x-api-key"="supersecret123"} -Method GET
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

# Test 5: Mark attendance
Write-Host ""
Write-Host "5. Testing /api/attendance/mark (marking attendance)" -ForegroundColor Yellow
$attendanceData = @{
    cardId = "03B74B06"
    teacherId = "test-teacher-123"
    subject = "IoT"
    timeSlot = "08:45-09:45"
    date = "2025-01-25"
    timestamp = "2025-01-25T08:47:12Z"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/attendance/mark" -Headers @{"Content-Type"="application/json"; "x-api-key"="supersecret123"} -Method POST -Body $attendanceData
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

# Test 6: Deactivate session
Write-Host ""
Write-Host "6. Testing /api/session DELETE (deactivating session)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/session" -Headers @{"x-api-key"="supersecret123"} -Method DELETE
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

# Test 7: Check currentTeacher again (should return 404 after deactivation)
Write-Host ""
Write-Host "7. Testing /api/currentTeacher (should return 404 after deactivation)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/currentTeacher" -Headers @{"x-api-key"="supersecret123"} -Method GET
    Write-Host "Response: $($response.Content)"
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green
