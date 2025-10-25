"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, isAdmin, getUserData } from "@/lib/auth";

interface ActiveSession {
  date: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

interface TimetableEntry {
  subjectName: string;
  timeSlot: string;
  teacherEmail?: string;
}

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

export default function AdminPage() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [viewDate, setViewDate] = useState("");
  const [viewSubject, setViewSubject] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [availableEntries, setAvailableEntries] = useState<TimetableEntry[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const router = useRouter();

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  // compute day code from YYYY-MM-DD date
  function dayCodeFromDate(isoDate: string) {
    if (!isoDate) return "";
    const d = new Date(isoDate + "T00:00:00");
    const days = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];
    return days[d.getDay()];
  }

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const adminStatus = await isAdmin(user.uid);
      if (!adminStatus) {
        await logoutUser();
        router.push("/login");
        return;
      }
      setAuthorized(true);

      const userData = await getUserData(user.uid);
      setUserName(userData?.name || "");
      setCurrentUserEmail(userData?.email || null);

      // decide if they are "super admin" (full admin) or a teacher admin who should only see their subjects
      setIsSuperAdmin(userData?.role === "admin");

      setSelectedDate(getCurrentDate());
      setViewDate(getCurrentDate());

      // load timetable for today's date automatically
      const todayDay = dayCodeFromDate(getCurrentDate());
      if (todayDay) await fetchTimetableForDay(todayDay, userData?.email ?? null);
      await fetchActiveSession();
    };

    init();
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const fetchActiveSession = async () => {
    try {
      const res = await fetch("/api/session");
      if (res.ok) {
        const sess = await res.json();
        setActiveSession(sess);
      }
    } catch (err) {
      console.error("fetchActiveSession:", err);
    }
  };

  // Fetch timetable entries for a given day code (MON/TUE/...)
  const fetchTimetableForDay = async (dayCode: string, filterByTeacherEmail: string | null = null) => {
    if (!dayCode) {
      setAvailableEntries([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/timetables?day=${encodeURIComponent(dayCode)}`);
      if (!res.ok) {
        setMessage("Failed to load timetable for " + dayCode);
        setAvailableEntries([]);
        return;
      }
      const data: { subjects?: TimetableEntry[] } = await res.json();
      let entries = Array.isArray(data.subjects) ? data.subjects : [];

      // Filter by teacher email - show only subjects taught by the logged-in teacher
      if (filterByTeacherEmail) {
        entries = entries.filter((e) => (e.teacherEmail || "").toLowerCase() === filterByTeacherEmail.toLowerCase());
      }

      setAvailableEntries(entries);
      // auto-select first subject for convenience
      if (entries.length > 0) {
        setSelectedSubject(entries[0].subjectName);
      } else {
        setSelectedSubject("");
        setMessage(`No subjects found for ${dayCode}${filterByTeacherEmail ? ` for teacher ${filterByTeacherEmail}` : ""}`);
      }
    } catch (err) {
      console.error("fetchTimetableForDay error:", err);
      setAvailableEntries([]);
      setMessage("Error loading timetable");
    } finally {
      setLoading(false);
    }
  };

  // When admin selects a date -> fetch the day timetable for that date
  const onSelectedDateChange = async (isoDate: string) => {
    setSelectedDate(isoDate);
    const day = dayCodeFromDate(isoDate);
    await fetchTimetableForDay(day, currentUserEmail);
  };

  const setActiveSessionHandler = async () => {
    if (!selectedDate || !selectedSubject) {
      setMessage("Please select date and subject.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, subject: selectedSubject }),
      });
      if (res.ok) {
        const result = await res.json();
        setActiveSession(result.session);
        setMessage(`Active session set for ${selectedSubject} on ${selectedDate}`);
      } else {
        const err = await res.json();
        setMessage(err.message || "Error setting session");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error setting session");
    } finally {
      setLoading(false);
    }
  };

  const deactivateSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/session", { method: "DELETE" });
      if (res.ok) {
        setActiveSession(null);
        setMessage("Session deactivated");
      }
    } catch {
      setMessage("Error deactivating session");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!viewDate || !viewSubject) {
      setMessage("Select date & subject to view attendance");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${viewDate}&subject=${encodeURIComponent(viewSubject)}`);
      if (!res.ok) {
        const e = await res.json();
        setMessage(e.message || "Failed to fetch attendance");
        setAttendanceData([]);
        return;
      }
      const records = await res.json();
      setAttendanceData(records);
      setMessage(`Loaded ${records.length} records`);
    } catch (err) {
      console.error("fetchAttendance", err);
      setMessage("Error fetching attendance");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel - Attendance</h1>
            {userName && <p className="text-sm text-gray-600 mt-1">Welcome, {userName}</p>}
          </div>
          <button onClick={handleLogout} className="bg-gray-200 px-4 py-2 rounded">Logout</button>
        </div>

        {/* Active Session */}
        <div className="bg-white p-6 rounded mb-6 shadow">
          <h2 className="font-semibold mb-3">Current Active Session</h2>
          {activeSession ? (
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium">{activeSession.date} — {activeSession.subject}</div>
                <div className="text-xs text-gray-500">Active since: {new Date(activeSession.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={deactivateSession} className="bg-red-500 text-white px-3 py-2 rounded">Deactivate</button>
            </div>
          ) : (
            <div className="text-red-600">No active session</div>
          )}
        </div>

        {/* Set New Session: date -> fetch subjects for that day -> select subject */}
        <div className="bg-white p-6 rounded mb-6 shadow">
          <h2 className="font-semibold mb-3">Set New Active Session</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={selectedDate} onChange={(e) => onSelectedDateChange(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Select subject</option>
                {availableEntries.map((ent) => (
                  <option key={`${ent.subjectName}-${ent.timeSlot}`} value={ent.subjectName}>
                    {ent.subjectName} — {ent.timeSlot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={setActiveSessionHandler} className="bg-blue-600 text-white px-4 py-2 rounded">Set Active Session</button>
          </div>
        </div>

        {/* View Attendance */}
        <div className="bg-white p-6 rounded mb-6 shadow">
          <h2 className="font-semibold mb-3">View Attendance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input type="date" value={viewDate} onChange={(e) => {
                setViewDate(e.target.value);
                // also auto-load timetable for view date so users can pick subject
                const day = dayCodeFromDate(e.target.value);
                fetchTimetableForDay(day, currentUserEmail);
              }} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <select value={viewSubject} onChange={(e) => setViewSubject(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Select subject</option>
                {availableEntries.map((ent) => (
                  <option key={`${ent.subjectName}-${ent.timeSlot}`} value={ent.subjectName}>
                    {ent.subjectName} — {ent.timeSlot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={fetchAttendance} className="bg-green-600 text-white px-4 py-2 rounded">View</button>
          </div>
        </div>

        {message && <div className="mb-6 p-4 bg-blue-50 rounded text-blue-700">{message}</div>}

        {/* Attendance table */}
        {attendanceData.length > 0 && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-3">Attendance for {viewDate} — {viewSubject}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Student</th>
                    <th className="p-2 border">Roll</th>
                    <th className="p-2 border">Present</th>
                    <th className="p-2 border">Teacher</th>
                    <th className="p-2 border">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border">{r.name}</td>
                      <td className="p-2 border">{r.rollNumber}</td>
                      <td className="p-2 border">{r.present ? "Present" : "Absent"}</td>
                      <td className="p-2 border">{r.teacherEmail}</td>
                      <td className="p-2 border">{new Date(r.timestamp).toLocaleString()}</td>
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
