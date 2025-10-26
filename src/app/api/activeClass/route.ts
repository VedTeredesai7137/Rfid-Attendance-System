import { NextResponse } from "next/server";
import { db } from "../../../firebase/Client";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic"; // Prevents caching on Vercel

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let teacherId = searchParams.get("teacherId");
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { message: "Missing date parameter" },
        { status: 400 }
      );
    }

    // If teacherId is not provided, try to get it from currentActiveTeacher
    if (!teacherId) {
      const currentTeacherDoc = doc(db, "system", "currentActiveTeacher");
      const currentTeacherSnap = await getDoc(currentTeacherDoc);
      
      if (currentTeacherSnap.exists()) {
        const currentTeacherData = currentTeacherSnap.data();
        teacherId = currentTeacherData.teacherId;
      }
      
      if (!teacherId) {
        return NextResponse.json(
          { message: "No active teacher found" },
          { status: 404 }
        );
      }
    }

    // Get the session document for this teacher and date
    const sessionDocId = `${teacherId}_${date}`;
    const sessionDoc = doc(db, "sessions", sessionDocId);
    const sessionSnap = await getDoc(sessionDoc);

    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { message: "No active session" },
        { status: 404 }
      );
    }

    const sessionData = sessionSnap.data();

    // Check if session is active
    if (!sessionData.isActive) {
      return NextResponse.json(
        { message: "No active session" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subject: sessionData.subject,
      timeSlot: sessionData.timeSlot,
      date: sessionData.date,
      teacherId: sessionData.teacherId,
      teacherEmail: sessionData.teacherEmail,
      isActive: true
    });
  } catch (error) {
    console.error("Error fetching active class:", error);
    return NextResponse.json(
      { message: "Error fetching active class" },
      { status: 500 }
    );
  }
}
