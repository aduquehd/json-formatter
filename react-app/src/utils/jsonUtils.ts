import { JSONFixer } from './jsonFixer';

export function formatJSON(jsonString: string): string {
  if (!jsonString || jsonString.trim() === '') {
    return '';
  }

  try {
    // First try to parse directly
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    // Try to fix common issues using JSONFixer
    const result = JSONFixer.parseWithFixInfo(jsonString);
    
    if (result.data) {
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
  } catch (error) {
    // Try to fix common issues using JSONFixer
    const result = JSONFixer.parseWithFixInfo(jsonString);
    
    if (result.data) {
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
    const result = JSONFixer.parseWithFixInfo(jsonString);
    return result.data !== null;
  }
}