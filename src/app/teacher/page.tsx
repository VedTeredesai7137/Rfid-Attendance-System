"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, getUserData, isTeacher } from "@/lib/auth";

interface AttendanceRecord {
  uid: string;
  name: string;
  rollNumber: string;
  present: boolean;
  timestamp: string;
  date: string;
  subject: string;
  teacherEmail: string;
}

interface Student {
  uid: string;
  name: string;
  rollNumber: string;
}

export default function TeacherPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const router = useRouter();

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      
      // Check if user is teacher
      const teacherStatus = await isTeacher(currentUser.uid);
      if (!teacherStatus) {
        router.push("/login");
        return;
      }
      
      setAuthorized(true);
      setUserEmail(currentUser.email || "");
      
      // Fetch user data to get name
      const userData = await getUserData(currentUser.uid);
      if (userData && userData.name) {
        setUserName(userData.name);
      }
      
      setSelectedDate(getCurrentDate());
      fetchTeacherSubjects(currentUser.email || "");
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fetch teacher's subjects from Firestore
  const fetchTeacherSubjects = async (email: string) => {
    try {
      const response = await fetch(`/api/teacher/subjects?email=${email}`);
      if (response.ok) {
        const subjects = await response.json();
        setTeacherSubjects(subjects);
      } else {
        setMessage("Error fetching teacher subjects");
      }
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      setMessage("Error fetching teacher subjects");
    }
  };

  // Fetch students for a subject (mock data for now)
  const fetchStudents = async (subject: string) => {
    // In a real implementation, this would fetch from Firestore
    // For now, using mock data
    const mockStudents: Student[] = [
      { uid: "03 B7 4B 06", name: "Ved", rollNumber: "5023166" },
      { uid: "6A A1 E4 80", name: "Sumit", rollNumber: "5023167" },
    ];
    setStudents(mockStudents);
  };

  // Fetch attendance for selected date and subject
  const fetchAttendance = async () => {
    if (!selectedDate || !selectedSubject) {
      setMessage("Please select both date and subject");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/attendance?date=${selectedDate}&subject=${selectedSubject}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
        setMessage(`Found ${data.length} attendance records for ${selectedSubject}`);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch {
      setMessage("Error fetching attendance");
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance for a student
  const markAttendance = async (uid: string, present: boolean) => {
    if (!selectedDate || !selectedSubject) {
      setMessage("Please select date and subject first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          teacherEmail: userEmail,
          subject: selectedSubject,
          present,
        }),
      });

      if (response.ok) {
        setMessage(`Attendance marked successfully for ${uid}`);
        fetchAttendance(); // Refresh attendance data
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch {
      setMessage("Error marking attendance");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Attendance Panel</h1>
            {userName && (
              <p className="text-lg text-gray-600 mt-1">Welcome, {userName}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Subject Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Subject for Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  fetchStudents(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select subject</option>
                {teacherSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading || !selectedDate || !selectedSubject}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "View Attendance"}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* Student List for Attendance Marking */}
        {selectedSubject && students.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Mark Attendance for {selectedSubject} - {selectedDate}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Student Name</th>
                    <th className="border px-4 py-2 text-left">Roll Number</th>
                    <th className="border px-4 py-2 text-left">Present</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const attendanceRecord = attendanceData.find(record => record.uid === student.uid);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{student.name}</td>
                        <td className="border px-4 py-2">{student.rollNumber}</td>
                        <td className="border px-4 py-2">
                          {attendanceRecord ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              attendanceRecord.present 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendanceRecord.present ? 'Present' : 'Absent'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Marked
                            </span>
                          )}
                        </td>
                        <td className="border px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => markAttendance(student.uid, true)}
                              disabled={loading}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(student.uid, false)}
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Summary */}
        {attendanceData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Attendance Summary for {selectedDate} - {selectedSubject}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Students</h3>
                <p className="text-2xl font-bold text-blue-900">{students.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Present</h3>
                <p className="text-2xl font-bold text-green-900">
                  {attendanceData.filter(record => record.present).length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Absent</h3>
                <p className="text-2xl font-bold text-red-900">
                  {attendanceData.filter(record => !record.present).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
