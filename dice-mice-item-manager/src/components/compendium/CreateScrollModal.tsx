'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SpellTemplateWithDetails, materialDisplayNames, MaterialType } from '@/types/spells';
import { CharacterAutocomplete, Character, CrafterOption } from '@/components/ui/CharacterAutocomplete';

interface CreateScrollModalProps {
  template: SpellTemplateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onScrollCreated: () => void;
}

export function CreateScrollModal({
  template,
  isOpen,
  onClose,
  onScrollCreated
}: CreateScrollModalProps) {
  const { data: session } = useSession();
  const [material, setMaterial] = useState<MaterialType>('parchment');
  const [crafter, setCrafter] = useState<CrafterOption | null>(null);
  const [crafterLevel, setCrafterLevel] = useState<number>(1);
  const [isGruntWork, setIsGruntWork] = useState(false);
  const [supervisor, setSupervisor] = useState<CrafterOption | null>(null);
  const [supervisorLevel, setSupervisorLevel] = useState<number>(1);
  const [gruntWorker, setGruntWorker] = useState<CrafterOption | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch characters when modal opens
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters');
        const data = await response.json();
        if (data.success) {
          setCharacters(data.characters);
        }
      } catch (error) {
        console.error('Error fetching characters:', error);
      }
    };

    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen]);

  if (!isOpen || !template) return null;

  // Calculate if the spell can be crafted based on level restrictions
  const effectiveCrafterLevel = isGruntWork ? supervisorLevel : crafterLevel;
  const maxCraftableSpellLevel = effectiveCrafterLevel + 1;
  const canCraftSpell = template.level <= maxCraftableSpellLevel;

  // Determine who actually crafted it (for storage)
  const actualCrafterName = isGruntWork
    ? (gruntWorker?.type === 'character' ? gruntWorker.character!.name : gruntWorker?.display || '')
    : (crafter?.type === 'character' ? crafter.character!.name : crafter?.display || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || isSubmitting || !canCraftSpell) return;

    // Validation
    if (!actualCrafterName.trim()) {
      setError('Please select who crafted this scroll.');
      return;
    }

    if (isGruntWork && (!supervisor || !gruntWorker)) {
      setError('Please select both supervisor and grunt worker.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/scrolls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spellTemplateId: template.id,
          material,
          craftedBy: actualCrafterName.trim(),
          crafterLevel: effectiveCrafterLevel,
          weight: 0.33, // All scrolls default to 1/3rd of a slot capacity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create scroll');
      }

      // Reset form
      setMaterial('parchment');
      setCrafter(null);
      setCrafterLevel(1);
      setIsGruntWork(false);
      setSupervisor(null);
      setSupervisorLevel(1);
      setGruntWorker(null);
      setError('');

      // Show success message
      setSuccessMessage(`✅ Scroll created successfully! "${template.name}" scroll has been added to your inventory.`);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setSuccessMessage('');
        onScrollCreated();
      }, 2000);
    } catch (error) {
      console.error('Error creating scroll:', error);
      setError('Failed to create scroll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Scroll: {template.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Spell Level and Craftability Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <span className="font-medium">Spell Level {template.level}</span>
                {canCraftSpell ? (
                  <span className="text-green-600 dark:text-green-400 text-sm">✓ Can craft</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 text-sm">✗ Cannot craft (level too high)</span>
                )}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {isGruntWork
                  ? `Max craftable with level ${supervisorLevel} supervisor: Level ${maxCraftableSpellLevel}`
                  : `Max craftable at level ${crafterLevel}: Level ${maxCraftableSpellLevel}`
                }
              </p>
            </div>

            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Material
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as MaterialType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {Object.entries(materialDisplayNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grunt Work Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isGruntWork}
                  onChange={(e) => setIsGruntWork(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  This is grunt work under another crafter
                </span>
              </label>
            </div>

            {!isGruntWork ? (
              // Direct crafting fields
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crafter
                  </label>
                  <CharacterAutocomplete
                    characters={characters}
                    value={crafter}
                    onChange={setCrafter}
                    placeholder="Select or enter crafter name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crafter Level
                  </label>
                  <select
                    value={crafterLevel}
                    onChange={(e) => setCrafterLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(level => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              // Grunt work fields
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supervising Crafter
                  </label>
                  <CharacterAutocomplete
                    characters={characters}
                    value={supervisor}
                    onChange={setSupervisor}
                    placeholder="Select or enter supervisor name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supervisor Level
                  </label>
                  <select
                    value={supervisorLevel}
                    onChange={(e) => setSupervisorLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(level => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grunt Worker
                  </label>
                  <CharacterAutocomplete
                    characters={characters}
                    value={gruntWorker}
                    onChange={setGruntWorker}
                    placeholder="Select or enter grunt worker name..."
                  />
                </div>
              </>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !canCraftSpell}
                className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${canCraftSpell
                  ? 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white cursor-pointer'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? 'Creating...' : canCraftSpell ? 'Create Scroll' : 'Cannot Craft (Level Too High)'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
