import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Australian Eastern Standard Time (Brisbane - no daylight saving)
export const AEST_TIMEZONE = "Australia/Brisbane";

/**
 * Format a date in the user's local timezone
 * @param date - Date string, Date object, or timestamp (stored as UTC)
 * @param formatStr - date-fns format string (default: "dd MMM yyyy, h:mm a")
 * @returns Formatted date string in user's local timezone
 */
export function formatLocalTime(
  date: string | Date | number | null | undefined,
  formatStr: string = "dd MMM yyyy, h:mm a"
): string {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" || typeof date === "number" 
      ? new Date(date) 
      : date;
    return format(dateObj, formatStr);
  } catch {
    return "";
  }
}

/**
 * Format a date in AEST timezone (for admin display)
 * @param date - Date string, Date object, or timestamp
 * @param formatStr - date-fns format string (default: "dd MMM yyyy, h:mm a")
 * @returns Formatted date string in AEST
 */
export function formatAEST(
  date: string | Date | number | null | undefined,
  formatStr: string = "dd MMM yyyy, h:mm a"
): string {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" || typeof date === "number" 
      ? new Date(date) 
      : date;
    return formatInTimeZone(dateObj, AEST_TIMEZONE, formatStr) + " AEST";
  } catch {
    return "";
  }
}

/**
 * Format a date in AEST without the "AEST" suffix
 * @param date - Date string, Date object, or timestamp
 * @param formatStr - date-fns format string
 * @returns Formatted date string in AEST without suffix
 */
export function formatAESTShort(
  date: string | Date | number | null | undefined,
  formatStr: string = "dd MMM yyyy, h:mm a"
): string {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" || typeof date === "number" 
      ? new Date(date) 
      : date;
    return formatInTimeZone(dateObj, AEST_TIMEZONE, formatStr);
  } catch {
    return "";
  }
}

/**
 * Convert a date to AEST timezone Date object
 * @param date - Date string, Date object, or timestamp
 * @returns Date object in AEST
 */
export function toAEST(date: string | Date | number): Date {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;
  return toZonedTime(dateObj, AEST_TIMEZONE);
}

/**
 * Convert a datetime-local input value (interpreted as AEST) to UTC ISO string for storage
 * @param localDateTimeStr - datetime-local input value (e.g., "2025-01-15T14:30")
 * @returns ISO string in UTC
 */
export function aestToUTC(localDateTimeStr: string): string {
  if (!localDateTimeStr) return "";
  try {
    // The input is meant to be AEST time, so we convert it from AEST to UTC
    const utcDate = fromZonedTime(localDateTimeStr, AEST_TIMEZONE);
    return utcDate.toISOString();
  } catch {
    return localDateTimeStr;
  }
}

/**
 * Convert a UTC date to datetime-local format in AEST for form inputs
 * @param utcDate - UTC date string or Date object
 * @returns datetime-local compatible string in AEST
 */
export function utcToAESTInput(utcDate: string | Date | null | undefined): string {
  if (!utcDate) return "";
  try {
    const dateObj = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
    return formatInTimeZone(dateObj, AEST_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}
