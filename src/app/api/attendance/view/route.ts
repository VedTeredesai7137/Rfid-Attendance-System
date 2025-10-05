import { NextRequest, NextResponse } from "next/server";
import { getAttendanceBySession } from "@/lib/session";

// GET - Get attendance for a specific date and time slot
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");

    if (!date || !timeSlot) {
      return NextResponse.json({ message: "Date and timeSlot parameters are required" }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // Validate time slot format (e.g., "9-10", "10-11")
    const timeSlotRegex = /^\d{1,2}-\d{1,2}$/;
    if (!timeSlotRegex.test(timeSlot)) {
      return NextResponse.json({ message: "Invalid time slot format. Use format like '9-10'" }, { status: 400 });
    }

    const attendance = await getAttendanceBySession(date, timeSlot);
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
  }
}
