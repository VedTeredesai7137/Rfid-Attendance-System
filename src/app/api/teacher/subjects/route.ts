import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase/Client";
import { collection, getDocs } from "firebase/firestore";

// GET - Get teacher's subjects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ message: "Email parameter is required" }, { status: 400 });
    }

    // Fetch teacher's subjects from Firestore
    const teachersRef = collection(db, "teachers");
    const snapshot = await getDocs(teachersRef);
    
    for (const doc of snapshot.docs) {
      const teacherData = doc.data();
      if (teacherData.email === email) {
        return NextResponse.json(teacherData.subject || []);
      }
    }

    // If teacher not found, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json({ message: "Error fetching teacher subjects" }, { status: 500 });
  }
}
