export default function GuestHomeView() {
  return (
    <main className="container mx-auto px-6 py-12">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Manage Your D&D Items with Ease
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Keep track of all your magical items, weapons, and equipment in one place.
          Connect with Discord to get started!
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Item Management</h4>
              <p className="text-gray-600 dark:text-gray-300">Track all your items with detailed information</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔐</div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Discord Auth</h4>
              <p className="text-gray-600 dark:text-gray-300">Secure login with your Discord account</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">☁️</div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Cloud Storage</h4>
              <p className="text-gray-600 dark:text-gray-300">Your data is safely stored in the cloud</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
