'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CharacterCard, CharacterData } from '@/components/my-characters/CharacterCard';

export default function MyCharactersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCharacters();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-characters');

      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }

      const data = await response.json();

      if (data.success) {
        setCharacters(data.characters);
      } else {
        throw new Error(data.error || 'Failed to fetch characters');
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your mice...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please Sign In
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              You need to be signed in to view your mice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={fetchCharacters}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className='mb-4 sm:mb-0'>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Mice
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view your adventuring mice
            </p>
          </div>
          <div className="text-center">
            <button
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center space-x-2"
              onClick={() => router.push('/create-character')}
            >
              <span>➕</span>
              <span>Create New Mouse</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {characters.length > 0 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Your Adventure Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{characters.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {characters.length !== 1 ? 'Mice' : 'Mouse'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {characters.filter(c => c.currentStatus === 'ALIVE').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Alive</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...characters.map(c => c.currentLevel), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Highest Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {characters.reduce((sum, c) => sum + c.experience, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total XP</div>
              </div>
            </div>
          </div>
        )}

        {/* Characters Grid */}
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Mice Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You haven&apos;t created any mice yet. Start your adventure by creating your first mouse!
            </p>
            <button
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              onClick={() => router.push('/create-character')}
            >
              Create Your First Mouse
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onClick={() => router.push(`/character/${character.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}