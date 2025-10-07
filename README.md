
# Presence360: RFID Attendance System

Presence360 is a smart attendance management system built with Next.js, React, and Firebase. It leverages RFID technology for automated attendance logging and provides a modern web dashboard for administrators.

## Project Structure Overview

```text
Rfid-Attendance-System/
├── firebase/
│   └── Client.ts
├── public/
│   └── [static assets: SVGs, images]
├── src/  
│   ├── middleware.ts
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── attendance/
│   │   │   │   ├── route.ts
│   │   │   │   ├── studentData.ts
│   │   │   │   └── view/
│   │   │   │       └── route.ts
│   │   │   └── session/
│   │   │       └── route.ts
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── session.ts
├── [config files: package.json, next.config.ts, etc.]
```

## File Responsibilities and Connections

### Firebase Integration

- **firebase/Client.ts**  
	Initializes Firebase app using environment variables. Exports `db` (Firestore) and `auth` (Authentication) for use throughout the app.

### API Routes

- **src/app/api/attendance/route.ts**  
	Handles POST requests from the RFID device. Validates API key, checks for active session, normalizes UID, looks up student info, and logs attendance using Firestore via `logAttendanceWithSession` from `lib/session.ts`.

- **src/app/api/attendance/studentData.ts**  
	Contains a mapping of RFID UIDs to student names and roll numbers.

- **src/app/api/attendance/view/route.ts**  
	Handles GET requests to fetch attendance records for a specific date and time slot using `getAttendanceBySession` from `lib/session.ts`.

- **src/app/api/session/route.ts**  
	Handles session management:
	- **GET**: Returns the current active session.
	- **POST**: Sets a new active session (date and time slot).
	- **DELETE**: Deactivates the current session.

### Core Logic Libraries

- **src/lib/auth.ts**  
	Handles authentication (register, login, logout) using Firebase Auth. Also manages admin role assignment and verification in Firestore.

- **src/lib/firestore.ts**  
	Provides functions to log attendance and fetch all attendance records from Firestore.

- **src/lib/session.ts**  
	Manages session state in Firestore:
	- Set/get/deactivate active session.
	- Log attendance under specific session.
	- Fetch attendance by session.
	- List all attendance dates and time slots.

### Frontend Pages

- **src/app/layout.tsx**  
	Root layout for the app, sets up fonts and global styles.

- **src/app/globals.css**  
	Global CSS, includes TailwindCSS.

- **src/app/page.tsx**  
	Home page. Displays current active session and navigation links. Polls `/api/session` for session updates.

- **src/app/admin/page.tsx**  
	Admin dashboard. Authenticates user, allows session management, and displays attendance data. Uses functions from `lib/auth.ts` and `lib/session.ts`.

- **src/app/login/page.tsx**  
	Login page for admins. Uses `loginUser` from `lib/auth.ts`.

- **src/app/register/page.tsx**  
	Registration page for new admins. Uses `registerUser` from `lib/auth.ts`.

### Middleware

- **src/middleware.ts**  
	Configures Next.js middleware to protect `/admin` routes. Actual authentication is handled client-side due to Firebase's token model.

### Static Assets

- **public/**  
	Contains images and SVGs used in the UI.

## Database Connection

- **Firestore**  
	All attendance, session, and user data is stored in Firebase Firestore.  
	- Attendance is logged under hierarchical paths: `attendance/{date}/{timeSlot}/{uid}`.
	- Sessions are managed in the `sessions` collection.
	- User roles are stored in the `users` collection.

- **Authentication**  
	Uses Firebase Auth for user management. Only users with the "admin" role (set in Firestore) can access the admin dashboard.

## How Files Are Connected

- API routes import utility functions from `lib/` to interact with Firestore and Auth.
- Frontend pages use hooks and functions from `lib/` to fetch data and manage authentication.
- The middleware ensures only authenticated admins can access protected routes.
- The Firebase client is initialized once and shared across all modules needing database or authentication access.

## How Attendance Logging Works

1. **RFID Device** sends a POST request to `/api/attendance` with UID and API key.
2. **API Route** validates the request, checks for an active session, and logs attendance in Firestore.
3. **Admin Dashboard** displays attendance records by fetching data from Firestore via API routes.

## Environment Variables

Set the following in your `.env.local` for Firebase and ESP32 API key:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
ESP32_API_KEY=...
```

## Summary

Presence360 is a full-stack RFID attendance system with secure admin management, real-time session control, and robust database integration using Firebase. The codebase is modular, with clear separation between API logic, authentication, session management, and UI.
