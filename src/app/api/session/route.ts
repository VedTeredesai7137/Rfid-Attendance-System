import { NextRequest, NextResponse } from "next/server";
import { getActiveSession, setActiveSession, deactivateSession } from "@/lib/session";

// GET - Get current active session
export async function GET() {
  try {
    const activeSession = await getActiveSession();
    return NextResponse.json(activeSession);
  } catch (error) {
    console.error("Error fetching active session:", error);
    return NextResponse.json({ message: "Error fetching active session" }, { status: 500 });
  }
}

// POST - Set new active session
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { date, subject } = data as { date?: string; subject?: string };

    if (!date || !subject) {
      return NextResponse.json({ message: "Date and subject are required" }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    await setActiveSession(date, subject);
    const session = await getActiveSession();

    return NextResponse.json({
      message: "Active session set successfully",
      session,
    });
  } catch (error) {
    console.error("Error setting active session:", error);
    return NextResponse.json({ message: "Error setting active session" }, { status: 500 });
  }
}

// DELETE - Deactivate current session
export async function DELETE() {
  try {
    await deactivateSession();
    return NextResponse.json({ message: "Session deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating session:", error);
    return NextResponse.json({ message: "Error deactivating session" }, { status: 500 });
  }
}
