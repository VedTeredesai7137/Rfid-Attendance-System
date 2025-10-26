import { NextRequest, NextResponse } from "next/server";
import { studentDatabase } from "../studentData";
import { db } from "../../../firebase/Client";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

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

// Fetch teacher's email from users collection by teacherId
async function getTeacherEmail(teacherId: string): Promise<string | null> {
  try {
    const userDoc = doc(db, "users", teacherId);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.email;
    }
    return null;
  } catch (error) {
    console.error("Error fetching teacher email:", error);
    return null;
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
    const { cardId, teacherId, subject, timeSlot, date, timestamp, teacherEmail } = data as { 
      cardId?: string; 
      teacherId?: string; 
      subject?: string; 
      timeSlot?: string;
      date?: string;
      timestamp?: string;
      teacherEmail?: string;
    };

    if (!cardId || !teacherId || !subject || !timeSlot || !date) {
      return NextResponse.json({ 
        message: "Missing required fields: cardId, teacherId, subject, timeSlot, date" 
      }, { status: 400 });
    }

    // Get teacher email from teacherId
    const teacherEmailFromDB = await getTeacherEmail(teacherId);
    if (!teacherEmailFromDB) {
      // For testing purposes, use the teacherEmail from the request if provided
      const fallbackEmail = teacherEmail || `teacher-${teacherId}@example.com`;
      console.log(`Teacher not found in users collection, using fallback: ${fallbackEmail}`);
      
      const normalizedUid = normalizeUid(cardId);
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
        fallbackEmail
      );

      const item: AttendanceItem = {
        uid: normalizedUid,
        name: student.name,
        rollNumber: student.rollNo,
        present: true,
        timestamp: timestamp || new Date().toISOString(),
        date: date,
        subject: subject,
        teacherEmail: fallbackEmail,
      };

      console.log("✅ Attendance Recorded:", { 
        uid: normalizedUid, 
        subject: subject, 
        timeSlot: timeSlot,
        teacher: fallbackEmail,
        student: student.name,
        timestamp: timestamp
      });

      return NextResponse.json({ 
        success: true,
        id: normalizedUid, 
        item
      });
    }

    const normalizedUid = normalizeUid(cardId);
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
      teacherEmailFromDB
    );

    const item: AttendanceItem = {
      uid: normalizedUid,
      name: student.name,
      rollNumber: student.rollNo,
      present: true,
      timestamp: timestamp || new Date().toISOString(),
      date: date,
      subject: subject,
      teacherEmail: teacherEmailFromDB,
    };

    console.log("✅ Attendance Recorded:", { 
      uid: normalizedUid, 
      subject: subject, 
      timeSlot: timeSlot,
      teacher: teacherEmailFromDB,
      student: student.name,
      timestamp: timestamp
    });

    return NextResponse.json({ 
      success: true,
      id: normalizedUid, 
      item
    });
  } catch (err) {
    console.error("Error processing attendance:", err);
    return NextResponse.json({ message: "Error processing request" }, { status: 500 });
  }
}
