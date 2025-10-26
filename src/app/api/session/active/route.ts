import { NextResponse } from "next/server";
import { db } from "../../../../../firebase/Client";
import { doc, setDoc, getDoc } from "firebase/firestore";

// POST - Set active session
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { subject, timeSlot, date, isActive } = data;

    if (!subject || !timeSlot || !date) {
      return NextResponse.json({ 
        message: "Missing required fields: subject, timeSlot, date" 
      }, { status: 400 });
    }

    // Create or update active session
    const sessionData = {
      subject,
      timeSlot,
      date,
      isActive: isActive !== false, // Default to true
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "sessions", "active"), sessionData);

    return NextResponse.json({ 
      success: true,
      message: "Active session updated",
      session: sessionData
    });

  } catch (error) {
    console.error("Error setting active session:", error);
    return NextResponse.json({ 
      message: "Error setting active session" 
    }, { status: 500 });
  }
}

// GET - Get current active session
export async function GET() {
  try {
    const sessionDoc = doc(db, "sessions", "active");
    const sessionSnap = await getDoc(sessionDoc);

    if (!sessionSnap.exists()) {
      return NextResponse.json({
        subject: "",
        timeSlot: "",
        date: "",
        isActive: false
      });
    }

    const sessionData = sessionSnap.data();
    return NextResponse.json(sessionData);

  } catch (error) {
    console.error("Error fetching active session:", error);
    return NextResponse.json({
      subject: "",
      timeSlot: "",
      date: "",
      isActive: false
    }, { status: 500 });
  }
}

// DELETE - Clear active session
export async function DELETE() {
  try {
    await setDoc(doc(db, "sessions", "active"), {
      subject: "",
      timeSlot: "",
      date: "",
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: "Active session cleared"
    });

  } catch (error) {
    console.error("Error clearing active session:", error);
    return NextResponse.json({ 
      message: "Error clearing active session" 
    }, { status: 500 });
  }
}
