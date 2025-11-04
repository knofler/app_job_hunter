'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Org {
  id: string;
  name: string;
  description?: string;
}

interface UserWithRoles {
  [key: string]: unknown;
  'https://your-domain/roles'?: string[];
}

export default function AdminOrgsPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roles = ((user as UserWithRoles)?. ['https://your-domain/roles'] || []) as string[];
    if (!roles.includes('admin') && !roles.includes('power_user')) {
      router.push('/');
      return;
    }

    fetchOrgs();
  }, [user, router]);

  const fetchOrgs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orgs`, {
        headers: {
          'X-Admin-Token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '',
        },
      });
      const data = await response.json();
      setOrgs(data.items || []);
    } catch (error) {
      console.error('Failed to fetch orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Organization Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orgs.map((org) => (
              <tr key={org.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {org.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{org.description || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button className="text-green-600 hover:text-green-900 mr-4">Members</button>
                  <button className="text-purple-600 hover:text-purple-900">LLM Settings</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Create New Organization
      </button>
    </div>
  );
}
