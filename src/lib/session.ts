// src/lib/session.ts
import { db } from "../../firebase/Client";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface ActiveSession {
  date: string; // YYYY-MM-DD format
  timeSlot: string; // e.g., "9-10", "10-11"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  uid: string;
  name: string;
  rollNo: string;
  timestamp: string;
  date: string;
  timeSlot: string;
}

// Set active session
export async function setActiveSession(date: string, timeSlot: string): Promise<void> {
  const sessionDoc = doc(db, "sessions", "active");
  const session: ActiveSession = {
    date,
    timeSlot,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await setDoc(sessionDoc, session);
  console.log(`Active session set: ${date} - ${timeSlot}`);
}

// Get active session
export async function getActiveSession(): Promise<ActiveSession | null> {
  const sessionDoc = doc(db, "sessions", "active");
  const docSnap = await getDoc(sessionDoc);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as ActiveSession;
    return data.isActive ? data : null;
  }
  
  return null;
}

// Deactivate current session
export async function deactivateSession(): Promise<void> {
  const sessionDoc = doc(db, "sessions", "active");
  await setDoc(sessionDoc, { isActive: false }, { merge: true });
  console.log("Session deactivated");
}

// Log attendance under specific date and time slot
export async function logAttendanceWithSession(
  uid: string,
  name: string,
  rollNo: string,
  date: string,
  timeSlot: string
): Promise<string> {
  // Create hierarchical path: attendance/{date}/{timeSlot}/{uid}
  const attendanceDoc = doc(db, "attendance", date, timeSlot, uid);
  
  const attendanceRecord: AttendanceRecord = {
    uid,
    name,
    rollNo,
    timestamp: new Date().toISOString(),
    date,
    timeSlot,
  };
  
  await setDoc(attendanceDoc, attendanceRecord);
  console.log(`Attendance logged: ${uid} for ${date} ${timeSlot}`);
  
  return attendanceDoc.id;
}

// Get attendance for a specific date and time slot
export async function getAttendanceBySession(date: string, timeSlot: string): Promise<AttendanceRecord[]> {
  const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
  
  const attendanceRef = collection(db, "attendance", date, timeSlot);
  const q = query(attendanceRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: data.uid,
      name: data.name,
      rollNo: data.rollNo,
      timestamp: data.timestamp,
      date: data.date,
      timeSlot: data.timeSlot,
    } as AttendanceRecord;
  });
}

// Get all dates with attendance
export async function getAllAttendanceDates(): Promise<string[]> {
  const { collection, getDocs } = await import("firebase/firestore");
  
  const attendanceRef = collection(db, "attendance");
  const querySnapshot = await getDocs(attendanceRef);
  
  return querySnapshot.docs.map((doc) => doc.id).sort();
}

// Get all time slots for a specific date
export async function getTimeSlotsForDate(date: string): Promise<string[]> {
  const { collection, getDocs } = await import("firebase/firestore");
  
  const dateRef = collection(db, "attendance", date);
  const querySnapshot = await getDocs(dateRef);
  
  return querySnapshot.docs.map((doc) => doc.id).sort();
}
