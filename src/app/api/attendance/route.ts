import { NextRequest, NextResponse } from "next/server";

type AttendanceItem = {
  uid: string;
  timestamp: string;
};

// In-memory log for simplicity (replace with DB later)
const attendanceLog: AttendanceItem[] = [];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { uid } = data;

    if (!uid) {
      return NextResponse.json({ message: "UID missing" }, { status: 400 });
    }

    const item: AttendanceItem = {
      uid,
      timestamp: new Date().toISOString(),
    };

    attendanceLog.push(item);
    console.log("New attendance recorded:", item);

    return NextResponse.json({ message: "UID received", uid });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error processing request" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(attendanceLog);
}
