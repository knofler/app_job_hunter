"use client";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full bg-white shadow mb-8">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-blue-700">AI Job Hunter</Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link>
          <Link href="/jobs" className="text-gray-700 hover:text-blue-700">Jobs</Link>
          <Link href="/my-jobs" className="text-gray-700 hover:text-blue-700">My Jobs</Link>
          <Link href="/candidates" className="text-gray-700 hover:text-blue-700">Candidates</Link>
          <Link href="/recruiters" className="text-gray-700 hover:text-blue-700">Recruiters</Link>
          <Link href="/resume" className="text-gray-700 hover:text-blue-700">Resumes</Link>
        </div>
        <div>
          <Link href="/profile" className="text-gray-700 hover:text-blue-700">Profile</Link>
        </div>
      </div>
    </nav>
  );
}
