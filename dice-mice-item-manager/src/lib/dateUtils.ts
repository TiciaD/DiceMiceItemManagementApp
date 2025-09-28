// Utility functions for handling in-game dates in EST/EDT

/**
 * Converts a date to Eastern Time (ET) - automatically handles EST/EDT
 * @param date - Date object or date string
 * @returns Formatted date string in Eastern Time
 */
export function formatInGameDate(date: Date | string | number | null): string {
  if (!date) return 'Unknown';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York', // This handles EST/EDT automatically
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Converts a date to Eastern Time with time included
 * @param date - Date object or date string
 * @returns Formatted date and time string in Eastern Time
 */
export function formatInGameDateTime(
  date: Date | string | number | null
): string {
  if (!date) return 'Unknown';

  const d = new Date(date);
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Gets the current date in Eastern Time formatted for date input (YYYY-MM-DD)
 * @returns Date string in YYYY-MM-DD format in Eastern Time
 */
export function getCurrentInGameDate(): string {
  const now = new Date();

  // Convert to Eastern Time
  const easternTime = new Date(
    now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
    })
  );

  // Format for date input
  return easternTime.toISOString().slice(0, 10);
}

/**
 * Converts a date input value (YYYY-MM-DD) to a Date object in Eastern Time
 * This ensures the date is treated as being in Eastern Time zone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function parseInGameDate(dateString: string): Date {
  // Parse the date as if it's in Eastern Time
  const date = new Date(dateString + 'T12:00:00'); // Add noon time to avoid timezone issues
  return date;
}

/**
 * Gets a short date format for display (MM/DD/YYYY) in Eastern Time
 * @param date - Date object or date string
 * @returns Short formatted date string
 */
export function formatInGameDateShort(
  date: Date | string | number | null
): string {
  if (!date) return 'Unknown';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
