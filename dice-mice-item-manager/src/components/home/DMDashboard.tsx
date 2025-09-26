import { Session } from 'next-auth';

interface DMDashboardProps {
  session: Partial<Session>;
}

export default function DMDashboard({ session }: DMDashboardProps) {
  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          DM Control Center 🎭
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome back, Dungeon Master {session.user?.name}!
        </p>
      </div>

      {/* DM Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">👥</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Players</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🏰</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">✨</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Custom Items</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🎲</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Sessions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* DM Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Campaign Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Management</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-4xl mb-4">🏰</div>
              <p>No campaigns yet</p>
              <p className="text-sm mt-2">Create your first campaign to get started!</p>
            </div>
          </div>
        </div>

        {/* Player Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Player Overview</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-4xl mb-4">👥</div>
              <p>No players yet</p>
              <p className="text-sm mt-2">Invite players to join your campaigns!</p>
            </div>
          </div>
        </div>
      </div>

      {/* DM Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DM Tools</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/create"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-2xl mr-4">✨</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create Magic Item</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Design custom items for your players</p>
            </div>
          </a>

          <a
            href="/compendium"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-2xl mr-4">📚</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Item Compendium</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Browse all available items</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-50 cursor-not-allowed"
          >
            <div className="text-2xl mr-4">🏰</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Campaign Manager</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-50 cursor-not-allowed"
          >
            <div className="text-2xl mr-4">👥</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Player Management</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-50 cursor-not-allowed"
          >
            <div className="text-2xl mr-4">📊</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</p>
            </div>
          </a>

          <a
            href="/my-items"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-2xl mr-4">🎒</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">My Items</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your personal items</p>
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}
