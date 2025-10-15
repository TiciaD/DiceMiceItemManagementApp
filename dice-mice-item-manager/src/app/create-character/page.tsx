'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CharacterCreationForm } from '@/components/character-creation/CharacterCreationForm';

export default function CreateCharacterPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      checkUserHouse();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const checkUserHouse = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/character-creation-data');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.userHouse) {
          setHasHouse(true);
        } else {
          setHasHouse(false);
        }
      } else if (response.status === 400) {
        // User doesn't have a house
        setHasHouse(false);
      } else {
        // Other error, still show the form and let it handle the error
        setHasHouse(true);
      }
    } catch (error) {
      console.error('Error checking user house:', error);
      // Allow form to handle the error
      setHasHouse(true);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be signed in to create a character.
            </p>
            <button
              onClick={() => router.push('/')}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasHouse) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              House Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You must create a house before you can create a character. Your characters belong to your house and represent your family&apos;s legacy.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Create House
              </button>
              <button
                onClick={() => router.back()}
                className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Character
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Forge your legend and begin your adventure
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Character Creation Form */}
        <CharacterCreationForm />

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            Character Creation Tips
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Your county&apos;s associated stat should be rolled with 4d6 (keep highest 3)</li>
            <li>• All other stats should be rolled with 3d6</li>
            <li>• Classes require at least 13 in their prerequisite stats</li>
            <li>• Your character starts at Level 1 with 0 experience points</li>
            <li>• Choose your trait carefully - A mouse&apos;s Character Trait is something designed to inform roleplay and give a minor bonus to checks made during scenes where their trait is taken into account.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}