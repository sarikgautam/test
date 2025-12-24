import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Australian Eastern Standard Time (Brisbane - no daylight saving)
export const AEST_TIMEZONE = "Australia/Brisbane";

/**
 * Format a date in AEST timezone
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
