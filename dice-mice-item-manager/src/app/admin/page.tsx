'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'BASIC' | 'DM';
}

export default function AdminPage() {
  const { data: session, status, update } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current user data
  useEffect(() => {
    if (session) {
      fetchCurrentUser();
    }
  }, [session]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user-role');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const updateRole = async (role: 'BASIC' | 'DM') => {
    if (!currentUser) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          role: role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully updated role to ${role}`);
        setCurrentUser({ ...currentUser, role });
        // Update the session to reflect the new role
        await update();
        // Refresh the page to show the new dashboard
        // setTimeout(() => {
        //   window.location.href = '/';
        // }, 1000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to update role');
      console.error('Failed to update role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div>Loading...</div>
    </div>;
  }

  if (!session) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div>Please sign in to access this page.</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            User Role Management
          </h1>

          {currentUser && (
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Current User Info:</h3>
                <p className="text-gray-600 dark:text-gray-300"><strong>Name:</strong> {currentUser.name}</p>
                <p className="text-gray-600 dark:text-gray-300"><strong>Email:</strong> {currentUser.email}</p>
                <p className="text-gray-600 dark:text-gray-300"><strong>Current Role:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${currentUser.role === 'DM'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    }`}>
                    {currentUser.role}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Change Role:</h3>

                <div className="flex gap-4">
                  <button
                    onClick={() => updateRole('BASIC')}
                    disabled={loading || currentUser.role === 'BASIC'}
                    className={`px-4 py-2 rounded-md transition-colors ${currentUser.role === 'BASIC'
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    Set as Player (BASIC)
                  </button>

                  <button
                    onClick={() => updateRole('DM')}
                    disabled={loading || currentUser.role === 'DM'}
                    className={`px-4 py-2 rounded-md transition-colors ${currentUser.role === 'DM'
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                  >
                    Set as Dungeon Master (DM)
                  </button>
                </div>

                {loading && (
                  <div className="text-blue-600 dark:text-blue-400">Updating role...</div>
                )}

                {message && (
                  <div className={`p-3 rounded-md ${message.includes('Success')
                    ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'
                    : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100'
                    }`}>
                    {message}
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Role Descriptions:</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li><strong>BASIC (Player):</strong> Access to personal dashboard, create items, browse compendium</li>
                  <li><strong>DM (Dungeon Master):</strong> Advanced tools for campaign management, player oversight, and administrative features</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
