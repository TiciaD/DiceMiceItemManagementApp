'use client';

import { useState, useMemo } from 'react';
import { Combobox } from '@headlessui/react';

export interface Character {
  id: string;
  name: string;
  currentLevel: number;
  house: {
    id: string;
    name: string;
  };
}

export interface CrafterOption {
  id: string;
  type: 'character' | 'free';
  display: string;
  character?: Character;
}

interface CharacterAutocompleteProps {
  characters: Character[];
  value: CrafterOption | null;
  onChange: (option: CrafterOption | null) => void;
  error?: string;
  placeholder?: string;
}

// Pre-defined free options for non-character crafters
const FREE_OPTIONS: CrafterOption[] = [
  { id: 'npc', type: 'free', display: 'NPC' },
  { id: 'unknown', type: 'free', display: 'Unknown' },
  { id: 'found', type: 'free', display: 'Found Item' },
];

export function CharacterAutocomplete({
  characters,
  value,
  onChange,
  error,
  placeholder = 'Select or search for a crafter...',
}: CharacterAutocompleteProps) {
  const [query, setQuery] = useState('');

  // Convert characters to crafter options
  const characterOptions: CrafterOption[] = useMemo(() =>
    characters.map(char => ({
      id: char.id,
      type: 'character' as const,
      display: `${char.name} (${char.house.name}, Level ${char.currentLevel})`,
      character: char,
    })), [characters]
  );

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    // Combine all options inside useMemo to avoid dependency issues
    const allOptions = [...FREE_OPTIONS, ...characterOptions];

    if (query === '') return allOptions;

    const lowerQuery = query.toLowerCase();
    return allOptions.filter(option =>
      option.display.toLowerCase().includes(lowerQuery) ||
      (option.character?.name.toLowerCase().includes(lowerQuery)) ||
      (option.character?.house.name.toLowerCase().includes(lowerQuery))
    );
  }, [query, characterOptions]);

  return (
    <div className="relative">
      <Combobox value={value} onChange={onChange}>
        <div className="relative">
          <Combobox.Input
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10 ${error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-600'
              }`}
            displayValue={(option: CrafterOption | null) => {
              if (!option) return '';
              // For characters, show only the name when selected
              if (option.type === 'character') {
                return option.character?.name || '';
              }
              // For free options, show the display text
              return option.display;
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Combobox.Button>
        </div>

        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
              Nothing found.
            </div>
          ) : (
            <div>
              {/* Show free options first */}
              {filteredOptions.filter(opt => opt.type === 'free').length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                    General Options
                  </div>
                  {filteredOptions
                    .filter(opt => opt.type === 'free')
                    .map((option) => (
                      <Combobox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-900 dark:text-white'
                          }`
                        }
                        value={option}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {option.display}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                  }`}
                              >
                                <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                </div>
              )}

              {/* Show character options */}
              {filteredOptions.filter(opt => opt.type === 'character').length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                    Player Characters
                  </div>
                  {filteredOptions
                    .filter(opt => opt.type === 'character')
                    .map((option) => (
                      <Combobox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-900 dark:text-white'
                          }`
                        }
                        value={option}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              <span className="font-medium">{option.character!.name}</span>
                              <span className={`ml-2 text-sm ${active ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                {option.character!.house.name}, Level {option.character!.currentLevel}
                              </span>
                            </div>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                  }`}
                              >
                                <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                </div>
              )}
            </div>
          )}
        </Combobox.Options>
      </Combobox>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}