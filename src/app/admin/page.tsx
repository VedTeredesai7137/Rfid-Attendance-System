"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, isAdmin, getUserData } from "@/lib/auth";

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

  // Predefined time slots
  const timeSlots = [
    "9-10", "10-11", "11-12","13-14", "14-15", "15-16"
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
          <div className="bg-white rounded-lg shadow-md p-6">
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
      </div>
    </div>
  );
}
