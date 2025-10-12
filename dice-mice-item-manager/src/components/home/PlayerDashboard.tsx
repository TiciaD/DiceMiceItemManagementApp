import { Session } from 'next-auth';
import HouseSection from './HouseSection';

interface PlayerDashboardProps {
  session: Partial<Session>;
}

export default function PlayerDashboard({ session }: PlayerDashboardProps) {
  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {session.user?.name}! 🎲
        </h1>
      </div>

      {/* House Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your House</h2>
        <HouseSection />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🎒</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">My Items</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">✨</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Magic Items</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">⚔️</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weapons</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🪙</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gold</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Items</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-4xl mb-4">📦</div>
              <p>No items yet</p>
              <p className="text-sm mt-2">Start by creating your first magic item!</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <a
              href="/create"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mr-4">✨</div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Create Magic Item</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Design a new custom magic item</p>
              </div>
            </a>

            <a
              href="/compendium"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mr-4">📚</div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Browse Compendium</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Explore existing magic items</p>
              </div>
            </a>

            <a
              href="/my-items"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mr-4">🎒</div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage My Items</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and organize your items</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
