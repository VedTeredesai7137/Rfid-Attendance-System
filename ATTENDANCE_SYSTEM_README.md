# RFID Attendance System with Session Management

## Overview
This system allows administrators to create manual attendance slots and automatically record student attendance when RFID cards are scanned.

## System Architecture

### Components
1. **ESP32 + RC522 RFID Reader** - Scans student cards and sends UID to backend
2. **Next.js Backend API** - Processes UIDs and manages sessions
3. **Firebase Firestore** - Stores attendance data hierarchically
4. **Admin Web Interface** - Manages attendance sessions

### Data Flow
```
ESP32 Scan → POST /api/attendance → Check Active Session → Save to Firebase → Return Response
```

## Firebase Structure

### Sessions Collection
```
sessions/
└─ active/
    ├─ date: "2025-10-04"
    ├─ timeSlot: "9-10"
    ├─ isActive: true
    ├─ createdAt: "2025-10-04T09:00:00Z"
    └─ updatedAt: "2025-10-04T09:00:00Z"
```

### Attendance Collection (Hierarchical)
```
attendance/
└─ 2025-10-04/
    └─ 9-10/
        └─ 03 B7 4B 06/
            ├─ uid: "03 B7 4B 06"
            ├─ name: "Ved"
            ├─ rollNo: "5023166"
            ├─ timestamp: "2025-10-04T09:02:10Z"
            ├─ date: "2025-10-04"
            └─ timeSlot: "9-10"
```

## API Endpoints

### 1. Attendance Recording
- **POST** `/api/attendance`
- **Headers**: `x-api-key: supersecret123`
- **Body**: `{"uid": "03 B7 4B 06"}`
- **Response**: 
  ```json
  {
    "message": "UID received",
    "id": "documentId",
    "item": {
      "uid": "03 B7 4B 06",
      "name": "Ved",
      "rollNo": "5023166",
      "timestamp": "2025-10-04T09:02:10Z",
      "date": "2025-10-04",
      "timeSlot": "9-10"
    },
    "session": {
      "date": "2025-10-04",
      "timeSlot": "9-10"
    }
  }
  ```

### 2. Session Management
- **GET** `/api/session` - Get current active session
- **POST** `/api/session` - Set new active session
  ```json
  {
    "date": "2025-10-04",
    "timeSlot": "9-10"
  }
  ```
- **DELETE** `/api/session` - Deactivate current session

### 3. View Attendance
- **GET** `/api/attendance/view?date=2025-10-04&timeSlot=9-10` - Get attendance for specific session

## Usage Instructions

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin`
2. **Set Active Session**: 
   - Select date (YYYY-MM-DD format)
   - Select time slot (e.g., "9-10", "10-11")
   - Click "Set Active Session"
3. **View Attendance**: 
   - Select date and time slot
   - Click "View Attendance" to see records
4. **Deactivate Session**: Click "Deactivate" to stop recording

### For Students
- Simply scan RFID card when active session is running
- System automatically records attendance under current session

## ESP32 Code Requirements

The ESP32 code remains unchanged. It should:
- Send POST request to `/api/attendance`
- Include `x-api-key` header
- Send only UID in JSON format: `{"uid": "FORMATTED_UID"}`

## Error Handling

### No Active Session
If no session is active when a card is scanned:
```json
{
  "message": "No active session. Please set a date and time slot first.",
  "error": "NO_ACTIVE_SESSION"
}
```

### Invalid UID
If UID is not found in student database:
- Name and rollNo default to "Unknown"
- Attendance is still recorded

## Environment Variables

Set in your deployment environment:
```env
ESP32_API_KEY=supersecret123
```

## Student Database

Update `src/app/api/attendance/studentData.ts` to add new students:
```typescript
export const studentDatabase: Record<string, { name: string; rollNo: string }> = {
  "03 B7 4B 06": { name: "Ved", rollNo: "5023166" },
  "AB 12 34 56": { name: "Jane Smith", rollNo: "CS102" },
  // Add more students here
};
```

## Features

✅ **Session-based attendance** - Admin controls when attendance is recorded  
✅ **Hierarchical Firebase structure** - Organized by date and time slot  
✅ **Real-time session status** - Live updates on active sessions  
✅ **Admin interface** - Easy session management  
✅ **Error handling** - Graceful handling of missing sessions  
✅ **ESP32 compatibility** - No changes needed to Arduino code  
✅ **Student lookup** - Automatic name/rollNo enrichment  
✅ **Timestamp tracking** - Server-side timestamps for accuracy  

## Deployment

1. Deploy to Vercel/Netlify
2. Set environment variables
3. Update ESP32 server URL to deployed endpoint
4. Access admin panel at `https://your-domain.com/admin`
