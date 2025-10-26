import { NextRequest, NextResponse } from "next/server";
import { studentDatabase } from "./studentData";
import { getActiveSession, logAttendanceWithSession } from "@/lib/session";

type AttendanceItem = {
  uid: string;
  name: string;
  rollNo: string;
  timestamp: string;
  date: string;
  timeSlot: string;
};

function normalizeUid(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  // Optionally enforce two-digit hex groups separated by single spaces
  // If the UID might come without spaces, insert spaces every 2 chars here
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.ESP32_API_KEY;
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check for active session
    const activeSession = await getActiveSession();
    if (!activeSession) {
      return NextResponse.json({ 
        message: "No active session. Please set a date and time slot first.",
        error: "NO_ACTIVE_SESSION" 
      }, { status: 400 });
    }

    const data = await req.json();
    const { uid } = data as { uid?: string };

    if (!uid) {
      return NextResponse.json({ message: "UID missing" }, { status: 400 });
    }

    const normalizedUid = normalizeUid(uid);
    
    // Debug logging
    console.log("=== DEBUG INFO ===");
    console.log("Raw UID received:", JSON.stringify(uid));
    console.log("Normalized UID:", JSON.stringify(normalizedUid));
    console.log("Available database keys:", Object.keys(studentDatabase));
    console.log("Direct match test:", normalizedUid in studentDatabase);
    console.log("==================");
    
    const student = studentDatabase[normalizedUid] || { name: "Unknown", rollNo: "Unknown" };

    // Log attendance with session information
    const id = await logAttendanceWithSession(
      normalizedUid,
      student.name,
      student.rollNo,
      activeSession.date,
      activeSession.timeSlot
    );

    const item: AttendanceItem = {
      uid: normalizedUid,
      name: student.name,
      rollNo: student.rollNo,
      timestamp: new Date().toISOString(),
      date: activeSession.date,
      timeSlot: activeSession.timeSlot,
    };

    console.log("New attendance recorded:", { id, ...item });

    return NextResponse.json({ 
      message: "UID received", 
      id, 
      item,
      session: {
        date: activeSession.date,
        timeSlot: activeSession.timeSlot
      }
    });
  } catch (err) {
    console.error("Error processing attendance:", err);
    return NextResponse.json({ message: "Error processing request" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // For now, return empty array since we're using hierarchical structure
    // You can implement a different endpoint to get attendance by session
    return NextResponse.json([]);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
  }
}
