"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActiveSession {
  date: string;
  timeSlot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [lastScan, setLastScan] = useState<any>(null);

  // Fetch active session every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/session");
        if (res.ok) {
          const session = await res.json();
          setActiveSession(session);
        }
      } catch (err) {
        console.error("Error fetching active session:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">RFID Attendance System</h1>
          
          {/* Active Session Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Current Session Status</h2>
            {activeSession ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-green-800">
                      Active Session: {activeSession.date} - {activeSession.timeSlot}
                    </p>
                    <p className="text-sm text-green-600">
                      Started: {new Date(activeSession.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-800 font-medium">ACTIVE</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-red-800">No Active Session</p>
                    <p className="text-sm text-red-600">
                      Please set an active session in the admin panel to start recording attendance.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-800 font-medium">INACTIVE</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Admin sets an active session (date + time slot) in the admin panel</li>
              <li>Students scan their RFID cards</li>
              <li>Attendance is automatically recorded under the active session</li>
              <li>View attendance records in the admin panel</li>
            </ol>
          </div>

          {/* Admin Panel Link */}
          <div className="text-center">
            <Link 
              href="/admin"
              className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Go to Admin Panel
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">ESP32</div>
              <div className="text-sm text-gray-600">RFID Reader</div>
              <div className="text-xs text-green-600 mt-1">Ready</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Next.js</div>
              <div className="text-sm text-gray-600">Backend API</div>
              <div className="text-xs text-green-600 mt-1">Online</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">Firebase</div>
              <div className="text-sm text-gray-600">Database</div>
              <div className="text-xs text-green-600 mt-1">Connected</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
