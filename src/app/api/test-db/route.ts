import { NextResponse } from "next/server";
import { studentDatabase } from "../attendance/studentData";

export async function GET() {
  return NextResponse.json({
    message: "Database test",
    totalStudents: Object.keys(studentDatabase).length,
    students: studentDatabase,
    testUid: "2C CC D6 B0",
    testResult: studentDatabase["2C CC D6 B0"] || "NOT FOUND"
  });
}