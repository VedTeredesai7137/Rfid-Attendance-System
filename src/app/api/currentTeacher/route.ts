import { NextResponse } from "next/server";
import { db } from "../../../../firebase/Client";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic"; // Prevents caching on Vercel

export async function GET() {
  try {
    // Get the current active teacher from system/currentActiveTeacher document
    const currentTeacherDoc = doc(db, "system", "currentActiveTeacher");
    const docSnap = await getDoc(currentTeacherDoc);
    
    if (!docSnap.exists()) {
      return NextResponse.json(
        { message: "No active teacher" },
        { status: 404 }
      );
    }
    
    const data = docSnap.data();
    
    // Check if teacherId is empty (deactivated state)
    if (!data.teacherId || data.teacherId === "") {
      return NextResponse.json(
        { message: "No active teacher" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      teacherId: data.teacherId,
      teacherEmail: data.teacherEmail,
      teacherName: data.teacherName,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error("Error fetching current teacher:", error);
    return NextResponse.json(
      { message: "Error fetching current teacher" },
      { status: 500 }
    );
  }
}