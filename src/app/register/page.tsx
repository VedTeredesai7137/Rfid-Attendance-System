"use client";

import { useState, useEffect } from "react";
import { registerUser, getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RegisterPage = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.push("/admin");
      }
    };
    checkAuth();
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const user = await registerUser(email, password, name);
      setSuccess(`Registered successfully: ${user.email}`);
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Admin Registration</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create a new admin account to access the dashboard
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm text-center font-medium">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
