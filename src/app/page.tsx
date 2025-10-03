"use client";

import { useEffect, useState } from "react";

type AttendanceItem = {
  uid: string;
  name?: string;
  rollNo?: string;
  timestamp: string;
};

export default function Home() {
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  // Fetch attendance every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/attendance");
        const data: AttendanceItem[] = await res.json();
        setAttendance(data);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">RFID Attendance System</h1>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">UID</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Roll No</th>
            <th className="border px-4 py-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {attendance.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4">
                No cards scanned yet
              </td>
            </tr>
          ) : (
            attendance.map((item, index) => (
              <tr key={index} className="text-center">
                <td className="border px-4 py-2">{item.uid}</td>
                <td className="border px-4 py-2">{item.name ?? "-"}</td>
                <td className="border px-4 py-2">{item.rollNo ?? "-"}</td>
                <td className="border px-4 py-2">{item.timestamp}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
