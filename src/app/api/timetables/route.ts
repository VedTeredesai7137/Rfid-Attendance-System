import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase/Client";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

interface TimetableEntry {
  subjectName: string;
  timeSlot: string;
  teacherEmail?: string;
}

interface TimetableResponse {
  subjects: TimetableEntry[];
}

// GET - Get timetable for a specific day with enriched teacher email data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");

    if (!day) {
      return NextResponse.json({ 
        message: "Day parameter is required (e.g., MON, TUE, WED, THUR, FRI)" 
      }, { status: 400 });
    }

    // Validate day format
    const validDays = ["MON", "TUE", "WED", "THUR", "FRI", "SAT", "SUN"];
    if (!validDays.includes(day.toUpperCase())) {
      return NextResponse.json({ 
        message: "Invalid day format. Use MON, TUE, WED, THUR, FRI, SAT, or SUN" 
      }, { status: 400 });
    }

    // Fetch timetable document from Firestore
    const timetableDoc = doc(db, "timetables", day.toUpperCase());
    const timetableSnap = await getDoc(timetableDoc);

    if (!timetableSnap.exists()) {
      return NextResponse.json({ 
        message: `No timetable found for ${day}`,
        subjects: []
      }, { status: 404 });
    }

    const timetableData = timetableSnap.data();
    const subjects = timetableData.subjects || [];

    // Fetch all users to match subjects with teachers
    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Enrich subjects with teacher email by matching subjectName with user.Subjects array
    const enrichedSubjects: TimetableEntry[] = subjects.map((subject: any, index: number) => {
      // Find teacher by matching subjectName with user.Subjects array
      const teacher = users.find(user => 
        Array.isArray(user.Subjects) && user.Subjects.includes(subject.subjectName)
      );

      return {
        subjectName: subject.subjectName || `Subject ${index}`,
        timeSlot: subject.timeSlot || "Unknown",
        teacherEmail: teacher ? teacher.email : "Not assigned"
      };
    });

    const response: TimetableResponse = {
      subjects: enrichedSubjects
    };

    console.log(`Fetched timetable for ${day}:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json({ 
      message: "Error fetching timetable",
      subjects: []
    }, { status: 500 });
  }
}
