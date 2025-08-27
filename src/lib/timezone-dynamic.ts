/**
 * Dynamic timezone utilities that read from system settings
 */

import { db } from './db';

// Timezone offset mappings
const TIMEZONE_OFFSETS: Record<string, number> = {
  'IST': 5.5, // Indian Standard Time (UTC+5:30)
  'UTC': 0,   // Coordinated Universal Time
  'EST': -5,  // Eastern Standard Time (UTC-5)
  'PST': -8,  // Pacific Standard Time (UTC-8)
  'CET': 1,   // Central European Time (UTC+1)
};

/**
 * Get the configured timezone from system settings
 */
async function getConfiguredTimezone(): Promise<string> {
  if (!db) {
    return 'IST'; // Default to IST if database not configured
  }
  
  try {
    const result = await db.execute('SELECT setting_value FROM system_settings WHERE setting_name = ?', ['timezone']);
    const [rows] = result as any[];
    if (rows && rows.length > 0) {
      return rows[0].setting_value || 'IST';
    }
  } catch (error) {
    console.error('Failed to fetch timezone setting:', error);
  }
  
  return 'IST'; // Default to IST
}

/**
 * Get current date in configured timezone
 */
export async function getCurrentConfiguredDate(): Promise<Date> {
  const timezone = await getConfiguredTimezone();
  const offset = TIMEZONE_OFFSETS[timezone] || 5.5; // Default to IST offset
  
  const now = new Date();
  const offsetMs = offset * 60 * 60 * 1000; // Convert hours to milliseconds
  return new Date(now.getTime() + offsetMs);
}

/**
 * Get today's date string in YYYY-MM-DD format in configured timezone
 */
export async function getTodayDateString(): Promise<string> {
  const date = await getCurrentConfiguredDate();
  return date.toISOString().split('T')[0];
}

/**
 * Get yesterday's date string in YYYY-MM-DD format in configured timezone
 */
export async function getYesterdayDateString(): Promise<string> {
  const date = await getCurrentConfiguredDate();
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Format date for logging with configured timezone
 */
export async function formatDateTime(date: Date): Promise<string> {
  const timezone = await getConfiguredTimezone();
  
  const timezoneMap: Record<string, string> = {
    'IST': 'Asia/Kolkata',
    'UTC': 'UTC',
    'EST': 'America/New_York',
    'PST': 'America/Los_Angeles',
    'CET': 'Europe/Paris',
  };
  
  const timeZone = timezoneMap[timezone] || 'Asia/Kolkata';
  
  return date.toLocaleString('en-IN', {
    timeZone,
    hour12: false
  });
}

/**
 * Check if a given date string is today in configured timezone
 */
export async function isToday(dateString: string): Promise<boolean> {
  const today = await getTodayDateString();
  return dateString === today;
}

/**
 * Check if a given date string is yesterday in configured timezone
 */
export async function isYesterday(dateString: string): Promise<boolean> {
  const yesterday = await getYesterdayDateString();
  return dateString === yesterday;
}
