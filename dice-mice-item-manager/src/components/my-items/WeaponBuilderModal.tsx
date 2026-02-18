'use client';

import { useState } from 'react';
import WeaponBuilder from '@/components/tools/WeaponBuilder';
import {
  Handedness,
  DamageMode,
  ModeCode,
  DamageTypeConfig,
} from '@/types/weapons';

interface WeaponBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeaponCreated: () => void;
}

export function WeaponBuilderModal({ isOpen, onClose, onWeaponCreated }: WeaponBuilderModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (config: {
    name: string;
    weaponTemplateId?: string;
    handedness: Handedness;
    damageMode: DamageMode;
    modeCode: ModeCode;
    damageTypes: DamageTypeConfig[];
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weapons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        onWeaponCreated();
        onClose();
      } else {
        const error = await response.json();
        console.error('Failed to create weapon:', error);
        alert(error.error || 'Failed to create weapon');
      }
    } catch (error) {
      console.error('Error creating weapon:', error);
      alert('An error occurred while creating the weapon');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Create New Weapon</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <WeaponBuilder onSave={handleSave} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
