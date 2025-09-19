// lib/username-generator.ts

/**
 * Generates a unique username from a full name with random suffix to prevent duplicates
 * @param fullName - The full name to generate username from
 * @returns Generated username with random suffix
 */
export const generateUniqueUsername = (fullName: string): string => {
  if (!fullName || !fullName.trim()) {
    return `user${Math.floor(Math.random() * 90000) + 10000}`;
  }

  const names = fullName.trim().toLowerCase().split(/\s+/);
  let baseUsername: string;

  if (names.length === 1) {
    baseUsername = names[0];
  } else if (names.length === 2) {
    baseUsername = names[0] + names[1];
  } else {
    // For 3+ names, use first + last
    baseUsername = names[0] + names[names.length - 1];
  }

  // Remove special characters and ensure it's alphanumeric
  baseUsername = baseUsername.replace(/[^a-z0-9]/g, '');
  
  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = baseUsername.padEnd(3, '0');
  }

  // Add random 4-digit suffix to prevent duplicates
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
  return baseUsername + randomSuffix;
};

/**
 * Generates username from separate name parts
 * @param firstName - First name
 * @param lastName - Last name  
 * @param middleName - Optional middle name
 * @returns Generated username with random suffix
 */
export const generateUsernameFromParts = (
  firstName: string, 
  lastName: string, 
  middleName?: string
): string => {
  const parts = [firstName, middleName, lastName]
    .filter(part => part && part.trim())
    .map(part => part.trim());
  
  const fullName = parts.join(' ');
  return generateUniqueUsername(fullName);
};