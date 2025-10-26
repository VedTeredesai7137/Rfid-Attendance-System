# Test script for RFID Attendance System API endpoints
# Run this after starting the development server with: npm run dev

echo "Testing RFID Attendance System API Endpoints"
echo "============================================="

# Test 1: Check if currentTeacher endpoint exists (should return 404 initially)
echo ""
echo "1. Testing /api/currentTeacher (should return 404 - no active teacher)"
curl -X GET "http://localhost:3000/api/currentTeacher" -H "x-api-key: supersecret123" -w "\nHTTP Status: %{http_code}\n"

# Test 2: Set up a test session (requires teacher data)
echo ""
echo "2. Testing /api/session POST (setting up test session)"
curl -X POST "http://localhost:3000/api/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: supersecret123" \
  -d '{
    "date": "2025-01-25",
    "subject": "IoT",
    "timeSlot": "08:45-09:45",
    "teacherId": "test-teacher-123",
    "teacherEmail": "test@example.com",
    "teacherName": "Dr. Test Teacher"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Test 3: Check currentTeacher again (should now return teacher info)
echo ""
echo "3. Testing /api/currentTeacher (should now return teacher info)"
curl -X GET "http://localhost:3000/api/currentTeacher" -H "x-api-key: supersecret123" -w "\nHTTP Status: %{http_code}\n"

# Test 4: Check activeClass for the teacher
echo ""
echo "4. Testing /api/activeClass (should return session info)"
curl -X GET "http://localhost:3000/api/activeClass?teacherId=test-teacher-123&date=2025-01-25" -H "x-api-key: supersecret123" -w "\nHTTP Status: %{http_code}\n"

# Test 5: Mark attendance
echo ""
echo "5. Testing /api/attendance/mark (marking attendance)"
curl -X POST "http://localhost:3000/api/attendance/mark" \
  -H "Content-Type: application/json" \
  -H "x-api-key: supersecret123" \
  -d '{
    "cardId": "03B74B06",
    "teacherId": "test-teacher-123",
    "subject": "IoT",
    "timeSlot": "08:45-09:45",
    "date": "2025-01-25",
    "timestamp": "2025-01-25T08:47:12Z"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Test 6: Deactivate session
echo ""
echo "6. Testing /api/session DELETE (deactivating session)"
curl -X DELETE "http://localhost:3000/api/session" -H "x-api-key: supersecret123" -w "\nHTTP Status: %{http_code}\n"

# Test 7: Check currentTeacher again (should return 404 after deactivation)
echo ""
echo "7. Testing /api/currentTeacher (should return 404 after deactivation)"
curl -X GET "http://localhost:3000/api/currentTeacher" -H "x-api-key: supersecret123" -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test completed!"
