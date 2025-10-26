import { NextRequest, NextResponse } from "next/server";
import { studentDatabase } from "./studentData";
import { db } from "../../../../firebase/Client";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth } from "../../../../firebase/Client";

type AttendanceItem = {
  uid: string;
  name: string;
  rollNumber: string;
  present: boolean;
  timestamp: string;
  date: string;
  subject: string;
  teacherEmail: string;
};

function normalizeUid(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  return cleaned;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Fetch teacher's subjects from Firestore users collection
async function getTeacherSubjects(teacherEmail: string): Promise<string[]> {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      if (userData.email === teacherEmail) {
        return userData.Subjects || [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return [];
  }
}

// Log attendance for a specific subject and date
async function logAttendanceForSubject(
  uid: string,
  name: string,
  rollNumber: string,
  date: string,
  subject: string,
  teacherEmail: string
): Promise<string> {
  // Create hierarchical path: attendance/{date}/{subject}/{uid}
  const attendanceDoc = doc(db, "attendance", date, subject, uid);
  
  const attendanceRecord: AttendanceItem = {
    uid,
    name,
    rollNumber,
    present: true,
    timestamp: new Date().toISOString(),
    date,
    subject,
    teacherEmail,
  };
  
  await setDoc(attendanceDoc, attendanceRecord);
  console.log(`Attendance logged: ${uid} for ${date} ${subject} by ${teacherEmail}`);
  
  return attendanceDoc.id;
}

// Find teacher by subject from users collection
async function findTeacherBySubject(subject: string): Promise<string | null> {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      if (Array.isArray(userData.Subjects) && userData.Subjects.includes(subject)) {
        return userData.email;
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding teacher by subject:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.ESP32_API_KEY;
    
    // For RFID device requests, check API key
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { uid, date, subject, timeSlot, timestamp } = data as { 
      uid?: string; 
      date?: string; 
      subject?: string; 
      timeSlot?: string;
      timestamp?: string;
    };

    if (!uid || !date || !subject || !timeSlot) {
      return NextResponse.json({ 
        message: "Missing required fields: uid, date, subject, timeSlot" 
      }, { status: 400 });
    }

    // Find teacher who teaches this subject
    const teacherEmail = await findTeacherBySubject(subject);
    if (!teacherEmail) {
      return NextResponse.json({ 
        message: `No teacher found for subject: ${subject}` 
      }, { status: 404 });
    }

    const normalizedUid = normalizeUid(uid);
    const student = studentDatabase[normalizedUid] || { 
      name: "Unknown", 
      rollNo: "Unknown" 
    };

    // Log attendance for the subject
    const id = await logAttendanceForSubject(
      normalizedUid,
      student.name,
      student.rollNo,
      date,
      subject,
      teacherEmail
    );

    const item: AttendanceItem = {
      uid: normalizedUid,
      name: student.name,
      rollNumber: student.rollNo,
      present: true,
      timestamp: timestamp || new Date().toISOString(),
      date: date,
      subject: subject,
      teacherEmail: teacherEmail,
    };

    console.log("✅ Attendance Recorded:", { 
      uid: normalizedUid, 
      subject: subject, 
      timeSlot: timeSlot,
      teacher: teacherEmail,
      student: student.name,
      timestamp: timestamp
    });

    return NextResponse.json({ 
      success: true,
      message: "Attendance recorded successfully", 
      id, 
      item,
      attendance: {
        date: date,
        subject: subject,
        timeSlot: timeSlot,
        teacher: teacherEmail
      }
    });
  } catch (err) {
    console.error("Error processing attendance:", err);
    return NextResponse.json({ message: "Error processing request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const subject = searchParams.get('subject');

    if (!date || !subject) {
      return NextResponse.json({ 
        message: "Date and subject parameters are required" 
      }, { status: 400 });
    }

    // Fetch attendance records for the specified date and subject
    const attendanceRef = collection(db, "attendance", date, subject);
    const snapshot = await getDocs(attendanceRef);
    
    const attendanceRecords: AttendanceItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      attendanceRecords.push({
        uid: data.uid,
        name: data.name,
        rollNumber: data.rollNumber,
        present: data.present,
        timestamp: data.timestamp,
        date: data.date,
        subject: data.subject,
        teacherEmail: data.teacherEmail,
      });
    });

    return NextResponse.json(attendanceRecords);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
  }
}
