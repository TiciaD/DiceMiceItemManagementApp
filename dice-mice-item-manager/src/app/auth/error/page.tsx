'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Authentication Error
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">
              {error ? `Error: ${error}` : 'An authentication error occurred'}
            </div>
            <p className="text-gray-600 mb-6">
              There was a problem signing you in. This could be due to:
            </p>
            <ul className="text-left text-sm text-gray-500 mb-6 space-y-2">
              <li>• Database connection issues</li>
              <li>• Missing environment variables</li>
              <li>• Discord OAuth configuration problems</li>
              <li>• Network connectivity issues</li>
            </ul>
            <Link
              href="/"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
