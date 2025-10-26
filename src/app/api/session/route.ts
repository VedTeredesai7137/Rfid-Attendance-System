import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase/Client";
import { doc, setDoc, getDoc } from "firebase/firestore";

// GET - Get current active session (legacy support)
export async function GET() {
  try {
    const currentTeacherDoc = doc(db, "system", "currentActiveTeacher");
    const currentTeacherSnap = await getDoc(currentTeacherDoc);
    
    if (!currentTeacherSnap.exists()) {
      return NextResponse.json({ 
        date: "",
        subject: "",
        isActive: false 
      });
    }
    
    const currentTeacherData = currentTeacherSnap.data();
    if (!currentTeacherData.teacherId) {
      return NextResponse.json({ 
        date: "",
        subject: "",
        isActive: false 
      });
    }
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const sessionDocId = `${currentTeacherData.teacherId}_${today}`;
    const sessionDoc = doc(db, "sessions", sessionDocId);
    const sessionSnap = await getDoc(sessionDoc);
    
    if (!sessionSnap.exists()) {
      return NextResponse.json({ 
        date: "",
        subject: "",
        isActive: false 
      });
    }
    
    const sessionData = sessionSnap.data();
    return NextResponse.json({
      date: sessionData.date,
      subject: sessionData.subject,
      isActive: sessionData.isActive,
      teacherId: sessionData.teacherId,
      teacherEmail: sessionData.teacherEmail
    });
  } catch (error) {
    console.error("Error fetching active session:", error);
    return NextResponse.json({ message: "Error fetching active session" }, { status: 500 });
  }
}

// POST - Set new active session
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { date, subject, timeSlot, teacherId, teacherEmail, teacherName } = data as { 
      date?: string; 
      subject?: string; 
      timeSlot?: string;
      teacherId?: string;
      teacherEmail?: string;
      teacherName?: string;
    };

    if (!date || !subject || !timeSlot || !teacherId || !teacherEmail || !teacherName) {
      return NextResponse.json({ 
        message: "Missing required fields: date, subject, timeSlot, teacherId, teacherEmail, teacherName" 
      }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create/Update per-teacher session document
    const sessionDocId = `${teacherId}_${date}`;
    const sessionDoc = doc(db, "sessions", sessionDocId);
    
    const sessionData = {
      teacherId,
      teacherEmail,
      subject,
      timeSlot,
      date,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(sessionDoc, sessionData);

    // Update system/currentActiveTeacher document
    const currentTeacherDoc = doc(db, "system", "currentActiveTeacher");
    const currentTeacherData = {
      teacherId,
      teacherEmail,
      teacherName,
      updatedAt: now
    };
    
    await setDoc(currentTeacherDoc, currentTeacherData);

    console.log(`✅ Active session set: ${teacherName} (${teacherEmail}) - ${date} ${subject} ${timeSlot}`);

    return NextResponse.json({
      message: "Active session set successfully",
      session: {
        teacherId,
        teacherEmail,
        teacherName,
        subject,
        timeSlot,
        date,
        isActive: true
      }
    });
  } catch (error) {
    console.error("Error setting active session:", error);
    return NextResponse.json({ message: "Error setting active session" }, { status: 500 });
  }
}

// DELETE - Deactivate current session
export async function DELETE() {
  try {
    // Get current active teacher
    const currentTeacherDoc = doc(db, "system", "currentActiveTeacher");
    const currentTeacherSnap = await getDoc(currentTeacherDoc);
    
    if (currentTeacherSnap.exists()) {
      const currentTeacherData = currentTeacherSnap.data();
      
      if (currentTeacherData.teacherId) {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const sessionDocId = `${currentTeacherData.teacherId}_${today}`;
        const sessionDoc = doc(db, "sessions", sessionDocId);
        
        // Deactivate the session
        await setDoc(sessionDoc, { 
          isActive: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      // Clear current active teacher
      await setDoc(currentTeacherDoc, {
        teacherId: "",
        teacherEmail: "",
        teacherName: "",
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log("✅ Session deactivated and current teacher cleared");
    return NextResponse.json({ message: "Session deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating session:", error);
    return NextResponse.json({ message: "Error deactivating session" }, { status: 500 });
  }
}
