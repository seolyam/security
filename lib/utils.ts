import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix: number[][] = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1).fill(0));

  for (let i = 0; i <= aLen; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    const aChar = a.charAt(i - 1);
    for (let j = 1; j <= bLen; j++) {
      const bChar = b.charAt(j - 1);
      const cost = aChar === bChar ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLen][bLen];
}

export function normalizeDomain(domain?: string | null): string {
  if (!domain) return '';
  return domain.trim().toLowerCase();
}

export function stripSubdomain(domain: string): string {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split('.');
  if (parts.length <= 2) return normalized;
  return parts.slice(parts.length - 2).join('.');
}

export function extractEmailParts(raw?: string | null): {
  displayName: string | null;
  address: string | null;
  domain: string | null;
} {
  if (!raw) {
    return { displayName: null, address: null, domain: null };
  }

  const trimmed = raw.trim();
  const bracketMatch = trimmed.match(/^(.*)<([^>]+)>$/);

  let displayName: string | null = null;
  let address = trimmed;

  if (bracketMatch) {
    displayName = bracketMatch[1].replace(/"/g, '').trim() || null;
    address = bracketMatch[2].trim();
  }

  const emailMatch = address.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const emailAddress = emailMatch ? emailMatch[1].toLowerCase() : null;
  const domain = emailAddress ? emailAddress.split('@')[1] : null;

  return { displayName, address: emailAddress, domain };
}

export function containsSuspiciousUnicode(value?: string | null): boolean {
  if (!value) return false;
  return /[^\x00-\x7F]/.test(value);
}

export function hasNumericLookalike(value?: string | null): boolean {
  if (!value) return false;
  const suspiciousMap: Record<string, RegExp> = {
    '0': /o/gi,
    '1': /l|i/gi,
    '3': /e/gi,
    '5': /s/gi,
    '7': /t/gi
  };
  return Object.entries(suspiciousMap).some(([digit, regex]) => {
    return regex.test(value) && value.toLowerCase().includes(digit);
  });
}
