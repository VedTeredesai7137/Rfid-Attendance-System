"use client";

import { useState, useEffect, useCallback } from "react";

interface AttendanceRecord {
  uid: string;
  name: string;
  studentName: string;
  rollNo: string;
  timestamp: string;
  date: string;
  slot: string;
  subject?: string;
}

interface WeeklyData {
  weekNumber: number;
  totalRecords: number;
  startDate: string;
  endDate: string;
}

interface StudentStat {
  name: string;
  attended: number;
  totalLecturesConducted: number;
  percent: number;
  missedDays: number;
  attendedDays: number;
  status: string;
}

interface SlotStat {
  slot: string;
  totalAttendance: number;
  avgPerDay: string;
  attendanceRate: number;
  maxPossible: number;
}

interface GlobalStats {
  totalDays: number;
  totalSlots: number;
  totalLecturesConducted: number;
  totalStudents: number;
  totalAttendanceRecords: number;
  overallAttendanceRate: string;
}

export default function AttendanceOverview() {
  // State variables for attendance overview
  const [attendanceOverviewData, setAttendanceOverviewData] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentAttendanceData, setStudentAttendanceData] = useState<AttendanceRecord[]>([]);
  const [uniqueStudents, setUniqueStudents] = useState<string[]>([]);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(false);

  // New state variables for advanced analytics
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [slotStats, setSlotStats] = useState<SlotStat[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalDays: 0,
    totalSlots: 0,
    totalLecturesConducted: 0,
    totalStudents: 0,
    totalAttendanceRecords: 0,
    overallAttendanceRate: "0"
  });
  const [activeTab, setActiveTab] = useState<string>("weekly");

  // Predefined time slots
  const timeSlots = ["9-10", "10-11", "11-12", "13-14", "14-15", "15-16"];

  // --- Fetch attendance overview ---
  const fetchAttendanceOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const slots = ["9-10", "10-11", "11-12", "13-14", "14-15", "15-16"];
      const allRecords: AttendanceRecord[] = [];

      for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        for (const slot of slots) {
          try {
            const response = await fetch(`/api/attendance/view?date=${dateStr}&timeSlot=${slot}`);
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data)) {
                data.forEach((record: any) => {
                  const name = record.name || record.studentName || "Unknown";
                  allRecords.push({
                    uid: record.uid || "",
                    name: name,
                    studentName: name,
                    rollNo: record.rollNo || "",
                    timestamp: record.timestamp || new Date().toISOString(),
                    date: dateStr,
                    slot,
                    subject: record.subject || slot,
                  });
                });
              }
            }
          } catch {
            console.log(`No data for ${dateStr} ${slot}`);
          }
        }
      }

      const students = Array.from(new Set(allRecords.map((r) => r.studentName))).sort();
      setUniqueStudents(students);

      const groupedByWeek: Record<string, AttendanceRecord[]> = {};
      allRecords.forEach((rec) => {
        const weekNum = getWeekNumber(rec.date);
        if (!groupedByWeek[weekNum]) groupedByWeek[weekNum] = [];
        groupedByWeek[weekNum].push(rec);
      });

      const weekArray = Object.entries(groupedByWeek).map(([weekNumber, records]) => {
        const sorted = records.sort((a: AttendanceRecord, b: AttendanceRecord) => a.date.localeCompare(b.date));
        return {
          weekNumber: parseInt(weekNumber),
          totalRecords: records.length,
          startDate: sorted[0].date,
          endDate: sorted[sorted.length - 1].date,
        };
      });

      setWeeklyData(weekArray.sort((a, b) => b.weekNumber - a.weekNumber));
      setAttendanceOverviewData(allRecords);
      computeAdvancedAnalytics(allRecords);
    } catch (err) {
      console.error("Error fetching overview:", err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const computeAdvancedAnalytics = (allRecords: AttendanceRecord[]) => {
    if (allRecords.length === 0) return;

    const uniqueDates = [...new Set(allRecords.map(r => r.date))];
    const totalSlots = 6;
    const totalLecturesConducted = uniqueDates.length * totalSlots;
    const totalStudents = [...new Set(allRecords.map(r => r.studentName))].length;

    const globalStatsData: GlobalStats = {
      totalDays: uniqueDates.length,
      totalSlots,
      totalLecturesConducted,
      totalStudents,
      totalAttendanceRecords: allRecords.length,
      overallAttendanceRate: ((allRecords.length / (totalLecturesConducted * totalStudents)) * 100).toFixed(1)
    };
    setGlobalStats(globalStatsData);

    const students = [...new Set(allRecords.map(r => r.studentName))];
    const studentStatistics: StudentStat[] = students.map(name => {
      const studentRecords = allRecords.filter(r => r.studentName === name);
      const attended = studentRecords.length;
      const attendedDates = [...new Set(studentRecords.map(r => r.date))];
      const missedDays = uniqueDates.length - attendedDates.length;
      const percent = ((attended / totalLecturesConducted) * 100).toFixed(1);

      return {
        name,
        attended,
        totalLecturesConducted,
        percent: parseFloat(percent),
        missedDays,
        attendedDays: attendedDates.length,
        status: parseFloat(percent) >= 75 ? 'Good' : parseFloat(percent) >= 50 ? 'Average' : 'Poor'
      };
    });

    studentStatistics.sort((a, b) => b.percent - a.percent);
    setStudentStats(studentStatistics);

    const slotStatistics: SlotStat[] = timeSlots.map(slot => {
      const slotRecords = allRecords.filter(r => r.slot === slot);
      const avgAttendance = slotRecords.length / uniqueDates.length;
      const attendanceRate = ((slotRecords.length / (uniqueDates.length * totalStudents)) * 100).toFixed(1);
      
      return {
        slot,
        totalAttendance: slotRecords.length,
        avgPerDay: avgAttendance.toFixed(1),
        attendanceRate: parseFloat(attendanceRate),
        maxPossible: uniqueDates.length * totalStudents
      };
    });

    slotStatistics.sort((a, b) => b.attendanceRate - a.attendanceRate);
    setSlotStats(slotStatistics);
  };

  const handleStudentSelection = (studentName: string) => {
    setSelectedStudent(studentName);
    if (!studentName) {
      setStudentAttendanceData([]);
      return;
    }
    fetchStudentAttendance(studentName);
  };

  const fetchStudentAttendance = async (studentName: string) => {
    setOverviewLoading(true);
    try {
      const studentRecords = attendanceOverviewData.filter(
        (record) => record.studentName === studentName
      );
      setStudentAttendanceData(studentRecords.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      console.error("Error fetching student attendance:", err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const getWeekNumber = (dateString: string): number => {
    const date = new Date(`${dateString}T00:00:00Z`);
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + firstJan.getDay() + 1) / 7);
  };

  useEffect(() => {
    fetchAttendanceOverview();
  }, [fetchAttendanceOverview]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-2">📅</span>
        <h2 className="text-xl font-semibold">Attendance Overview</h2>
        {overviewLoading && (
          <div className="ml-4 text-sm text-gray-500">Loading...</div>
        )}
      </div>

      {globalStats.totalDays > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-800">📊 Global Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{globalStats.totalDays}</div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{globalStats.totalLecturesConducted}</div>
              <div className="text-sm text-gray-600">Total Lectures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{globalStats.totalStudents}</div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{globalStats.overallAttendanceRate}%</div>
              <div className="text-sm text-gray-600">Overall Rate</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "weekly"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📅 Weekly Summary
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "students"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          👥 Student Analytics
        </button>
        <button
          onClick={() => setActiveTab("slots")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "slots"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ⏰ Time Slot Analysis
        </button>
        <button
          onClick={() => setActiveTab("individual")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "individual"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🔍 Individual View
        </button>
      </div>

      {activeTab === "weekly" && (
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
                  {weeklyData.map((week: WeeklyData, index: number) => (
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
      )}

      {activeTab === "students" && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Student Attendance Analytics</h3>
          {studentStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-sm font-medium">Student</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Attended</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Total Lectures</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Attendance %</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Days Missed</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.map((student: StudentStat, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm font-medium">{student.name}</td>
                      <td className="border px-3 py-2 text-sm">{student.attended}</td>
                      <td className="border px-3 py-2 text-sm">{student.totalLecturesConducted}</td>
                      <td className={`border px-3 py-2 text-sm font-medium ${
                        student.percent >= 75 ? "text-green-600" : 
                        student.percent >= 50 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {student.percent}%
                      </td>
                      <td className="border px-3 py-2 text-sm">{student.missedDays}</td>
                      <td className="border px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          student.status === 'Good' ? "bg-green-100 text-green-800" :
                          student.status === 'Average' ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {overviewLoading ? "Loading student data..." : "No student data available"}
            </div>
          )}
        </div>
      )}

      {activeTab === "slots" && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Time Slot Performance Analysis</h3>
          {slotStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left text-sm font-medium">Time Slot</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Total Attendance</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Avg Per Day</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Attendance Rate</th>
                    <th className="border px-3 py-2 text-left text-sm font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {slotStats.map((slot: SlotStat, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm font-medium">{slot.slot}</td>
                      <td className="border px-3 py-2 text-sm">{slot.totalAttendance}</td>
                      <td className="border px-3 py-2 text-sm">{slot.avgPerDay}</td>
                      <td className={`border px-3 py-2 text-sm font-medium ${
                        slot.attendanceRate >= 75 ? "text-green-600" : 
                        slot.attendanceRate >= 50 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {slot.attendanceRate}%
                      </td>
                      <td className="border px-3 py-2 text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              slot.attendanceRate >= 75 ? "bg-green-500" : 
                              slot.attendanceRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(slot.attendanceRate, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {overviewLoading ? "Loading slot data..." : "No slot data available"}
            </div>
          )}
        </div>
      )}

      {activeTab === "individual" && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Individual Student Attendance</h3>
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
                  {studentAttendanceData.map((record: AttendanceRecord, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{record.date}</td>
                      <td className="border px-3 py-2 text-sm">{record.subject || record.slot}</td>
                      <td className="border px-3 py-2 text-sm text-gray-600">
                        {new Date(record.timestamp).toLocaleTimeString()}
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

          {selectedStudent && studentAttendanceData.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{selectedStudent}</span> has{" "}
                  <span className="font-bold">{studentAttendanceData.length}</span> attendance record(s)
                </p>
              </div>
              
              {(() => {
                const studentStat = studentStats.find((s: StudentStat) => s.name === selectedStudent);
                return studentStat ? (
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Attendance Rate:</span>
                        <span className={`ml-2 font-bold ${
                          studentStat.percent >= 75 ? "text-green-600" : 
                          studentStat.percent >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {studentStat.percent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Missed:</span>
                        <span className="ml-2 font-bold text-red-600">{studentStat.missedDays}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Attended:</span>
                        <span className="ml-2 font-bold text-green-600">{studentStat.attendedDays}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          studentStat.status === 'Good' ? "bg-green-100 text-green-800" :
                          studentStat.status === 'Average' ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {studentStat.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}

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
  );
}