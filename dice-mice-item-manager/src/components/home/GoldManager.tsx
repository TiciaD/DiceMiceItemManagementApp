'use client';

import { useState } from 'react';
import { HouseWithCounty } from '@/types/houses';
import { formatNumber } from '@/lib/number-utils';

interface GoldManagerProps {
  house: HouseWithCounty;
  onUpdate: (updatedHouse: HouseWithCounty) => void;
}

export default function GoldManager({ house, onUpdate }: GoldManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoldTransaction = async (operation: 'add' | 'remove') => {
    const goldAmount = parseInt(amount);

    if (!goldAmount || goldAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (operation === 'remove' && goldAmount > house.gold) {
      setError("You don't have enough gold to remove that amount");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newGoldAmount = operation === 'add'
        ? house.gold + goldAmount
        : house.gold - goldAmount;

      const response = await fetch('/api/house', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gold: newGoldAmount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update gold');
      }

      onUpdate(data.house);
      setAmount('');
      setIsOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update gold');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAmount('');
    setError(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full transition-colors border border-yellow-300"
      >
        <span className="mr-1">🪙</span>
        Manage Gold
      </button>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
          <span className="mr-2">🪙</span>
          Manage Gold
        </h4>
        <button
          onClick={handleClose}
          className="cursor-pointer text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
            Current Gold: <span className="font-semibold">{formatNumber(house.gold)}</span>
          </p>

          <label htmlFor="goldAmount" className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            id="goldAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-100"
            placeholder="Enter amount..."
            min="1"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => handleGoldTransaction('add')}
            disabled={isLoading || !amount || parseInt(amount) <= 0}
            className="cursor-pointer flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : `Add ${amount ? formatNumber(parseInt(amount)) : '0'} Gold`}
          </button>
          <button
            onClick={() => handleGoldTransaction('remove')}
            disabled={isLoading || !amount || parseInt(amount) <= 0 || parseInt(amount) > house.gold}
            className="cursor-pointer flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Removing...' : `Remove ${amount ? formatNumber(parseInt(amount)) : '0'} Gold`}
          </button>
        </div>

        {amount && parseInt(amount) > 0 && (
          <div className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
            <p><strong>Preview:</strong></p>
            <p>Add: {formatNumber(house.gold)} + {formatNumber(parseInt(amount))} = {formatNumber(house.gold + parseInt(amount))}</p>
            <p>Remove: {formatNumber(house.gold)} - {formatNumber(parseInt(amount))} = {formatNumber(Math.max(0, house.gold - parseInt(amount)))}</p>
          </div>
        )}
      </div>
    </div>
  );
}
