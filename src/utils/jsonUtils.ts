import { isParseSuccess } from './jsonDocument';
import { JSONFixer } from './jsonFixer';

/**
 * Whether a repair succeeded is decided by the absence of an error, never by the
 * truthiness of the repaired value. `0`, `false`, `null` and `""` are all valid
 * JSON documents, and testing the value reported every one of them as
 * unfixable — `formatJSON('0,')` threw "Invalid JSON format" for a document the
 * fixer had repaired cleanly. `JSONFixer.parseWithFixInfo` never returns data
 * and an error together, so the two signals cannot disagree.
 */

export function formatJSON(jsonString: string): string {
  if (!jsonString || jsonString.trim() === '') {
    return '';
  }

  try {
    // First try to parse directly
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Try to fix common issues using JSONFixer
    const result = JSONFixer.parseWithFixInfo(jsonString);

    if (isParseSuccess(result)) {
      return JSON.stringify(result.data, null, 2);
    }

    // If still can't parse, throw error
    throw new Error(result.error || 'Invalid JSON format');
  }
}

export function compactJSON(jsonString: string): string {
  if (!jsonString || jsonString.trim() === '') {
    return '';
  }

  try {
    // First try to parse directly
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch {
    // Try to fix common issues using JSONFixer
    const result = JSONFixer.parseWithFixInfo(jsonString);

    if (isParseSuccess(result)) {
      return JSON.stringify(result.data);
    }

    // If still can't parse, throw error
    throw new Error(result.error || 'Invalid JSON format');
  }
}

export function isValidJSON(jsonString: string): boolean {
  if (!jsonString || jsonString.trim() === '') {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    // Try with JSONFixer
    return isParseSuccess(JSONFixer.parseWithFixInfo(jsonString));
  }
}
