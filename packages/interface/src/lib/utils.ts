import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncate an address for display: 0x1234...abcd
 */
export function truncateAddress(address: string, prefixLen = 6, suffixLen = 4): string {
  if (address.length <= prefixLen + suffixLen) return address
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`
}
