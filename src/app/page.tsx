"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface ActiveSession {
  date: string;
  timeSlot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

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
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-white via-gray-50 to-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo / Brand */}
        <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
          Presence<span className="text-gray-800">360</span>
        </div>

        {/* Nav Links */}
        <div className="flex space-x-8 text-sm font-medium">
          <Link
            href="/admin"
            className="text-gray-700 hover:text-indigo-600 relative group transition-colors"
          >
            Admin Panel
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
          </Link>

          <Link
            href="/admin"
            className="text-gray-700 hover:text-indigo-600 relative group transition-colors"
          >
            Attendance Dashboard
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
          </Link>

          <Link
            href="#contact"
            className="text-gray-700 hover:text-indigo-600 relative group transition-colors"
          >
            Contact Us
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
          </Link>

          <Link
            href="/profile"
            className="text-gray-700 hover:text-indigo-600 relative group transition-colors"
          >
            Profile
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
          </Link>
        </div>
      </div>
    </nav>

      {/* Hero Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center text-center px-6 bg-cover bg-center" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/hero-bg.jpg)`, 
        }} 
      > 
        <div className="max-w-4xl space-y-6 text-white z-10"> 
          <h1 className="text-5xl md:text-6xl font-bold leading-tight"> 
            Smart Attendance System 
          </h1> 
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto"> 
            Fast, Reliable, and Automated way to track student attendance 
          </p> 
          <Link
  href="/admin"
  className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium px-8 py-4 mt-4 rounded-lg hover:scale-105 transition-transform"
>
  Admin Panel
</Link>

        </div> 
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Easy Session Management</h3>
              <p className="text-gray-600">Start and manage attendance sessions with just a click. No complicated setup required.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Attendance Reports</h3>
              <p className="text-gray-600">Generate detailed reports and analytics to track attendance patterns over time.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Secure System</h3>
              <p className="text-gray-600">Built with security in mind. Your data is protected with industry-standard encryption.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Real-Time Updates</h3>
              <p className="text-gray-600">Instant attendance tracking as students scan their RFID cards. No delays.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-500 py-16 px-6"> 
        <div className="mx-auto max-w-4xl text-center space-y-6"> 
          <h2 className="text-3xl md:text-4xl font-bold text-white"> 
            Ready to automate your attendance tracking? 
          </h2> 
          <p className="text-lg text-white/90"> 
            Join hundreds of institutions already using our system 
          </p> 
          <Link href="/admin" className="inline-block bg-white text-blue-600 text-lg font-medium px-10 py-6 rounded-lg hover:scale-105 transition-transform">
            Explore Dashboard
          </Link>
        </div> 
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Presence360</h3>
            <p className="text-gray-300">Revolutionizing attendance tracking with RFID technology.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/admin" className="text-gray-300 hover:text-white transition-colors">Admin Panel</Link></li>
              <li><Link href="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/register" className="text-gray-300 hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>
          <div id="contact">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-300 mb-2">Email: info@presence360.com</p>
            <p className="text-gray-300">Phone: +1 (555) 123-4567</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Presence360. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
