import { NextResponse } from "next/server";
import { db } from "../../../../firebase/Client";
import { collection, getDocs } from "firebase/firestore";

// GET - Get all available subjects
export async function GET() {
  try {
    // Fetch all subjects from Firestore teachers collection
    const teachersRef = collection(db, "teachers");
    const snapshot = await getDocs(teachersRef);
    
    const allSubjects = new Set<string>();
    
    snapshot.forEach((doc) => {
      const teacherData = doc.data();
      if (teacherData.subject && Array.isArray(teacherData.subject)) {
        teacherData.subject.forEach((subject: string) => {
          allSubjects.add(subject);
        });
      }
    });

    const subjectsArray = Array.from(allSubjects).sort();
    
    // If no subjects found in Firestore, return predefined subjects
    if (subjectsArray.length === 0) {
      return NextResponse.json([
        "AT", "AI", "Cloud Computing", "PCE Lab", "Cloud Lab", "MAD Lab", 
        "PCE", "IoT", "IoT Lab", "Cyber Security", "Mini Project"
      ]);
    }

    return NextResponse.json(subjectsArray);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    // Return predefined subjects as fallback
    return NextResponse.json([
      "AT", "AI", "Cloud Computing", "PCE Lab", "Cloud Lab", "MAD Lab", 
      "PCE", "IoT", "IoT Lab", "Cyber Security", "Mini Project"
    ]);
  }
}
