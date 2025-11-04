

"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Job Hunter</h1>
          <p className="text-gray-600">Your intelligent career companion</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/api/auth/login"
            className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Log In
          </Link>
          
          <Link
            href="/api/auth/signup"
            className="block w-full bg-white text-blue-600 border-2 border-blue-600 text-center px-6 py-3 rounded-lg hover:bg-blue-50 transition font-semibold"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Features</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              AI-powered job matching
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Resume health analysis
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Smart application tracking
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Personalized career insights
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Note: Auth0 configuration required for authentication to work
        </p>
      </div>
    </div>
  );
}
