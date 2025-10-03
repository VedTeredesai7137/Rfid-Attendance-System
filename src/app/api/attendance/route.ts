import { NextRequest, NextResponse } from "next/server";
import { studentDatabase } from "./studentData";
import { logAttendance, getAttendance } from "@/lib/firestore";

type AttendanceItem = {
  uid: string;
  name: string;
  rollNo: string;
  timestamp: string;
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

    const data = await req.json();
    const { uid } = data as { uid?: string };

    if (!uid) {
      return NextResponse.json({ message: "UID missing" }, { status: 400 });
    }

    const normalizedUid = normalizeUid(uid);
    const student = studentDatabase[normalizedUid] || { name: "Unknown", rollNo: "Unknown" };

    const item: AttendanceItem = {
      uid: normalizedUid,
      name: student.name,
      rollNo: student.rollNo,
      timestamp: new Date().toISOString(),
    };

    const id = await logAttendance({ uid: item.uid, name: item.name, rollNo: item.rollNo });
    console.log("New attendance recorded:", { id, ...item });

    return NextResponse.json({ message: "UID received", id, item });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error processing request" }, { status: 500 });
  }
}

export async function GET() {
  const items = await getAttendance();
  return NextResponse.json(items);
}
