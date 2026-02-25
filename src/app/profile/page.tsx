'use client';

import { useUser } from '@/context/UserContext';
import Link from 'next/link';

interface UserWithCustomClaims {
  [key: string]: unknown;
  'https://ai-job-hunter/roles'?: string[];
  'https://ai-job-hunter/org_id'?: string;
}

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p>Please log in to view your profile.</p>
        <Link href="/api/auth/login" className="text-blue-600 hover:underline">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      
      <div className="bg-card rounded-xl shadow p-6 space-y-4">
        <div>
          <span className="font-semibold">Name:</span> {user.name || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Email:</span> {user.email || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Email Verified:</span> {user.email_verified ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-semibold">Subject (ID):</span>
          <span className="text-sm text-muted-foreground ml-2">{user.sub}</span>
        </div>
        <div>
          <span className="font-semibold">Roles:</span>
          <span className="text-sm text-muted-foreground ml-2">
            {(user as UserWithCustomClaims)['https://ai-job-hunter/roles']?.join(', ') ||
             'No roles assigned'}
          </span>
        </div>
        <div>
          <span className="font-semibold">Organization:</span>
          <span className="text-sm text-muted-foreground ml-2">
            {(user as UserWithCustomClaims)['https://ai-job-hunter/org_id'] ||
             'No organization'}
          </span>
        </div>

        <div className="pt-4">
          <Link
            href="/api/auth/logout"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Log Out
          </Link>
        </div>
      </div>

      {/* Resume section can be added back when integrating with backend */}
      <div className="bg-card rounded-xl shadow p-6 mt-6">
        <h2 className="text-lg font-semibold mb-2">Resume Management</h2>
        <p className="text-sm text-muted-foreground">Resume upload and management will be available after authentication setup.</p>
      </div>

      {/* Debug: Show all user properties */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow p-6 mt-6">
        <h2 className="text-lg font-semibold mb-2 text-yellow-800">🔍 Debug: Full User Object</h2>
        <pre className="text-xs bg-card p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
