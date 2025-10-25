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

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.ESP32_API_KEY;
    
    // For RFID device requests, check API key
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { uid, teacherEmail, subject } = data as { 
      uid?: string; 
      teacherEmail?: string; 
      subject?: string; 
    };

    if (!uid) {
      return NextResponse.json({ message: "UID missing" }, { status: 400 });
    }

    // Get current date
    const currentDate = getCurrentDate();
    
    let finalTeacherEmail = teacherEmail;
    let finalSubject = subject;

    // If teacherEmail is not provided, try to get it from the request context
    if (!finalTeacherEmail) {
      return NextResponse.json({ 
        message: "Teacher email is required for attendance logging" 
      }, { status: 400 });
    }

    // If subject is not provided, require it
    if (!finalSubject) {
      return NextResponse.json({ 
        message: "Subject is required for attendance logging" 
      }, { status: 400 });
    }

    // Verify that the teacher teaches this subject
    const teacherSubjects = await getTeacherSubjects(finalTeacherEmail);
    if (!teacherSubjects.includes(finalSubject)) {
      return NextResponse.json({ 
        message: `Teacher ${finalTeacherEmail} does not teach subject ${finalSubject}` 
      }, { status: 403 });
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
      currentDate,
      finalSubject,
      finalTeacherEmail
    );

    const item: AttendanceItem = {
      uid: normalizedUid,
      name: student.name,
      rollNumber: student.rollNo,
      present: true,
      timestamp: new Date().toISOString(),
      date: currentDate,
      subject: finalSubject,
      teacherEmail: finalTeacherEmail,
    };

    console.log("New attendance recorded:", { id, ...item });

    return NextResponse.json({ 
      message: "Attendance recorded successfully", 
      id, 
      item,
      attendance: {
        date: currentDate,
        subject: finalSubject,
        teacher: finalTeacherEmail
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
