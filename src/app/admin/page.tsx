"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, isAdmin, getUserData } from "@/lib/auth";
import { db } from "../../../firebase/Client";
import { collection, getDocs } from "firebase/firestore";

interface ActiveSession {
  date: string;
  timeSlot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  uid: string;
  name: string;
  rollNo: string;
  timestamp: string;
  date: string;
  timeSlot: string;
}



export default function AdminPage() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [viewDate, setViewDate] = useState("");
  const [viewTimeSlot, setViewTimeSlot] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();

  // New state variables for attendance overview
  const [attendanceOverviewData, setAttendanceOverviewData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentAttendanceData, setStudentAttendanceData] = useState<any[]>([]);
  const [uniqueStudents, setUniqueStudents] = useState<string[]>([]);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(false);

  // Predefined time slots
  const timeSlots = [
    "9-10", "10-11", "11-12", "13-14", "14-15", "15-16"
  ];

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



      // Check if user is admin
      const adminStatus = await isAdmin(currentUser.uid);
      if (!adminStatus) {
        await logoutUser();
        router.push("/login");
        return;
      }

      setAuthorized(true);

      // Fetch user data to get name
      const userData = await getUserData(currentUser.uid);
      if (userData && userData.name) {
        setUserName(userData.name);
      }

      fetchActiveSession();
      setSelectedDate(getCurrentDate());

      // Fetch attendance overview data
      fetchAttendanceOverview();
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

  const fetchActiveSession = async () => {
    try {
      const response = await fetch("/api/session");
      if (response.ok) {
        const session = await response.json();
        setActiveSession(session);
      }
    } catch (error) {
      console.error("Error fetching active session:", error);
    }
  };

  const setActiveSessionHandler = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      setMessage("Please select both date and time slot");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedTimeSlot,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setActiveSession(result.session);
        setMessage(`Active session set: ${selectedDate} ${selectedTimeSlot}`);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch {
      setMessage("Error setting active session");
    } finally {
      setLoading(false);
    }
  };

  const deactivateSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/session", {
        method: "DELETE",
      });

      if (response.ok) {
        setActiveSession(null);
        setMessage("Session deactivated");
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch {
      setMessage("Error deactivating session");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!viewDate || !viewTimeSlot) {
      setMessage("Please select both date and time slot to view attendance");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/view?date=${viewDate}&timeSlot=${viewTimeSlot}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
        setMessage(`Found ${data.length} attendance records`);
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

  // --- Fetch attendance overview ---
  const fetchAttendanceOverview = async () => {
    setOverviewLoading(true);
    try {
      // Since we can't use listCollections() on client-side, we'll use a different approach
      // We'll try to fetch data for a reasonable date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

      const slots = ["9-10", "10-11", "11-12", "13-14", "14-15", "15-16"];
      const allRecords: any[] = [];

      // Generate date range for the last 30 days
      for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        for (const slot of slots) {
          try {
            // Use the existing API endpoint that works correctly
            const response = await fetch(`/api/attendance/view?date=${dateStr}&timeSlot=${slot}`);
            if (response.ok) {
              const data = await response.json();
              data.forEach((record: any) => {
                const name = record.name || record.studentName || "Unknown";
                allRecords.push({
                  ...record,
                  date: dateStr,
                  slot,
                  studentName: name,
                  subject: record.subject || slot,
                  timestamp: record.timestamp,
                });
              });
            }
          } catch (error) {
            // Silently continue if a specific date/slot combination fails
            console.log(`No data for ${dateStr} ${slot}`);
          }
        }
      }

      // Extract unique students
      const students = Array.from(new Set(allRecords.map((r) => r.studentName))).sort();
      setUniqueStudents(students);

      // Compute weekly aggregation with fixed date parsing
      const groupedByWeek: Record<string, any[]> = {};
      allRecords.forEach((rec) => {
        const weekNum = getWeekNumber(rec.date);
        if (!groupedByWeek[weekNum]) groupedByWeek[weekNum] = [];
        groupedByWeek[weekNum].push(rec);
      });

      const weekArray = Object.entries(groupedByWeek).map(([weekNumber, records]) => {
        const sorted = records.sort((a, b) => a.date.localeCompare(b.date));
        return {
          weekNumber: parseInt(weekNumber),
          totalRecords: records.length,
          startDate: sorted[0].date,
          endDate: sorted[sorted.length - 1].date,
        };
      });

      setWeeklyData(weekArray.sort((a, b) => b.weekNumber - a.weekNumber));
      setAttendanceOverviewData(allRecords);
    } catch (err) {
      console.error("Error fetching overview:", err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // --- Handle Student Selection ---
  const handleStudentSelection = (studentName: string) => {
    setSelectedStudent(studentName);
    if (!studentName) {
      setStudentAttendanceData([]);
      return;
    }
    // Filter records of that student
    fetchStudentAttendance(studentName);
  };

  // --- Fetch selected student's attendance ---
  const fetchStudentAttendance = async (studentName: string) => {
    setOverviewLoading(true);
    try {
      // Filter from already loaded data instead of making new API calls
      const studentRecords = attendanceOverviewData.filter(
        (record: any) => record.studentName === studentName
      );

      setStudentAttendanceData(studentRecords.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      console.error("Error fetching student attendance:", err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // --- Helper: get ISO week number ---
  const getWeekNumber = (dateString: string): number => {
    const date = new Date(`${dateString}T00:00:00Z`);
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + firstJan.getDay() + 1) / 7);
  };

  if (!authorized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel - Attendance Sessions</h1>
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

        {/* Current Active Session */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Active Session</h2>
          {activeSession ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium text-green-800">
                    {activeSession.date} - {activeSession.timeSlot}
                  </p>
                  <p className="text-sm text-green-600">
                    Active since: {new Date(activeSession.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={deactivateSession}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Deactivating..." : "Deactivate"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">No active session. Please set a session below.</p>
            </div>
          )}
        </div>

        {/* Set New Session */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Set New Active Session</h2>
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
                Time Slot
              </label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select time slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} AM/PM
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={setActiveSessionHandler}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Setting..." : "Set Active Session"}
          </button>
        </div>

        {/* View Attendance */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">View Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slot
              </label>
              <select
                value={viewTimeSlot}
                onChange={(e) => setViewTimeSlot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select time slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} AM/PM
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
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

        {/* Attendance Table */}
        {attendanceData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Attendance for {viewDate} - {viewTimeSlot}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">UID</th>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Roll No</th>
                    <th className="border px-4 py-2 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{record.uid}</td>
                      <td className="border px-4 py-2">{record.name}</td>
                      <td className="border px-4 py-2">{record.rollNo}</td>
                      <td className="border px-4 py-2">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📅 Attendance Overview Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-2">📅</span>
            <h2 className="text-xl font-semibold">Attendance Overview</h2>
            {overviewLoading && (
              <div className="ml-4 text-sm text-gray-500">Loading...</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Attendance Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Weekly Attendance Summary</h3>
              {weeklyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-3 py-2 text-left text-sm font-medium">Week Number</th>
                        <th className="border px-3 py-2 text-left text-sm font-medium">Total Records</th>
                        <th className="border px-3 py-2 text-left text-sm font-medium">Date Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.map((week, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border px-3 py-2 text-sm">Week {week.weekNumber}</td>
                          <td className="border px-3 py-2 text-sm font-medium text-blue-600">
                            {week.totalRecords}
                          </td>
                          <td className="border px-3 py-2 text-sm text-gray-600">
                            {week.startDate === week.endDate
                              ? week.startDate
                              : `${week.startDate} - ${week.endDate}`
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {overviewLoading ? "Loading weekly data..." : "No attendance data available"}
                </div>
              )}
            </div>

            {/* Individual Student Attendance Viewer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Individual Student Attendance</h3>

              {/* Student Selection Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => handleStudentSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Choose a student...</option>
                  {uniqueStudents.map((student) => (
                    <option key={student} value={student}>
                      {student}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Attendance Table */}
              {selectedStudent && studentAttendanceData.length > 0 ? (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2 text-left text-sm font-medium">Date</th>
                        <th className="border px-3 py-2 text-left text-sm font-medium">Subject</th>
                        <th className="border px-3 py-2 text-left text-sm font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentAttendanceData.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border px-3 py-2 text-sm">{record.date}</td>
                          <td className="border px-3 py-2 text-sm">{record.subject || record.slot}</td>
                          <td className="border px-3 py-2 text-sm text-gray-600">
                            {record.timestamp?.toDate
                              ? record.timestamp.toDate().toLocaleTimeString()
                              : record.timestamp
                                ? new Date(record.timestamp).toLocaleTimeString()
                                : "N/A"
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedStudent ? (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found for {selectedStudent}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a student to view their attendance history
                </div>
              )}

              {/* Student Summary */}
              {selectedStudent && studentAttendanceData.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{selectedStudent}</span> has{" "}
                    <span className="font-bold">{studentAttendanceData.length}</span> attendance record(s)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={fetchAttendanceOverview}
              disabled={overviewLoading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 text-sm font-medium"
            >
              {overviewLoading ? "Refreshing..." : "Refresh Attendance Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
