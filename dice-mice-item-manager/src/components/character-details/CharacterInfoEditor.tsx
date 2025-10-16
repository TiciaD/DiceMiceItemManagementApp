'use client';

import { useState } from 'react';

interface CharacterInfoEditorProps {
  name: string;
  trait: string | null;
  onUpdate: (data: { name: string; trait: string | null }) => Promise<void>;
  isEditing: boolean;
  onToggleEdit: () => void;
  isLoading?: boolean;
}

export function CharacterInfoEditor({
  name,
  trait,
  onUpdate,
  isEditing,
  onToggleEdit,
  isLoading = false
}: CharacterInfoEditorProps) {
  const [nameValue, setNameValue] = useState(name);
  const [traitValue, setTraitValue] = useState(trait || '');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSave = async () => {
    setLocalLoading(true);
    try {
      await onUpdate({
        name: nameValue.trim(),
        trait: traitValue.trim() || null,
      });
      onToggleEdit();
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => {
    setNameValue(name);
    setTraitValue(trait || '');
    onToggleEdit();
  };

  if (!isEditing) {
    return (
      <div className="mb-4 md:mb-0 relative">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {name}
          </h1>
          <button
            onClick={onToggleEdit}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            disabled={isLoading || localLoading}
          >
            Edit
          </button>
        </div>
        {trait && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
            <strong>Trait:</strong> {trait}
          </p>
        )}
        {(isLoading || localLoading) && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 md:mb-0 space-y-3 relative">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Character Info
        </h2>
        <button
          onClick={handleCancel}
          className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          disabled={isLoading || localLoading}
        >
          Cancel
        </button>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Character Name
        </label>
        <input
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-gray-700 dark:text-white"
          placeholder="Enter character name"
          maxLength={100}
        />
      </div>

      {/* Trait Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Personality Trait (Optional)
        </label>
        <input
          type="text"
          value={traitValue}
          onChange={(e) => setTraitValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Brave, Cautious, Curious..."
          maxLength={200}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!nameValue.trim() || isLoading || localLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Save Changes
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading || localLoading}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 
                     rounded-md hover:bg-gray-400 dark:hover:bg-gray-700 text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Loading Overlay */}
      {(isLoading || localLoading) && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-700/80 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Updating character info...</span>
          </div>
        </div>
      )}
    </div>
  );
}