'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import GuestHomeView from '@/components/home/GuestHomeView';
import PlayerDashboard from '@/components/home/PlayerDashboard';
import DMDashboard from '@/components/home/DMDashboard';

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'BASIC' | 'DM';
}

export default function Home() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data including role when session is available
  useEffect(() => {
    async function fetchUserData() {
      if (status === 'loading') return;

      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user-role');
        if (response.ok) {
          const data = await response.json();
          setUserData({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: session.user?.image,
            role: data.user.role,
          });
        } else {
          // Fallback to session data if API fails
          setUserData({
            id: session.user.id,
            name: session.user?.name || '',
            email: session.user?.email || '',
            image: session.user?.image,
            role: (session.user as any)?.role || 'BASIC',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to session data if API fails
        setUserData({
          id: session.user.id,
          name: session.user?.name || '',
          email: session.user?.email || '',
          image: session.user?.image,
          role: (session.user as any)?.role || 'BASIC',
        });
      }

      setLoading(false);
    }

    fetchUserData();
  }, [session, status]);

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Create enhanced session object for components
  const enhancedSession = userData ? {
    ...session,
    user: userData
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {!enhancedSession ? (
        <GuestHomeView />
      ) : userData?.role === 'DM' ? (
        <DMDashboard session={enhancedSession} />
      ) : (
        <PlayerDashboard session={enhancedSession} />
      )}
    </div>
  );
}
