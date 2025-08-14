export interface JSONFixResult {
  data: any;
  wasFixed: boolean;
  fixes?: string[];
  error?: string;
}

export class JSONFixer {
  static tryFixJSON(jsonString: string): string {
    const result = this.tryFixJSONWithDetails(jsonString);
    return result.fixed;
  }
  
  static tryFixJSONWithDetails(jsonString: string): { fixed: string, fixes: string[] } {
    let fixed = jsonString.trim();
    const fixes: string[] = [];
    
    // Remove BOM (Byte Order Mark) if present
    if (fixed.charCodeAt(0) === 0xFEFF) {
      fixed = fixed.slice(1);
      fixes.push('BOM character');
    }
    
    // Fix double/multiple opening braces or brackets at the start
    if (/^{{+/.test(fixed)) {
      fixed = fixed.replace(/^{{+/, '{');
      fixes.push('multiple opening braces');
    }
    if (/^\[{2,}/.test(fixed)) {
      fixed = fixed.replace(/^\[{2,}/, '[');
      fixes.push('multiple opening brackets');
    }
    
    // Fix double/multiple closing braces or brackets at the end
    if (/}{2,}$/.test(fixed)) {
      fixed = fixed.replace(/}{2,}$/, '}');
      fixes.push('multiple closing braces');
    }
    if (/\]{2,}$/.test(fixed)) {
      fixed = fixed.replace(/\]{2,}$/, ']');
      fixes.push('multiple closing brackets');
    }
    
    // Handle common encoding issues
    if (/[\u2018\u2019]/.test(fixed)) {
      fixed = fixed.replace(/[\u2018\u2019]/g, "'"); // Smart quotes
      fixes.push('smart quotes');
    }
    if (/[\u201C\u201D]/.test(fixed)) {
      fixed = fixed.replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
      fixes.push('smart double quotes');
    }
    
    // Fix single quotes to double quotes (but not inside already quoted strings)
    const singleQuoteMatches = fixed.match(/(['"])((?:(?!\1).)*)\1/g);
    if (singleQuoteMatches && singleQuoteMatches.some(m => m[0] === "'")) {
      fixed = fixed.replace(/(['"])((?:(?!\1).)*)\1/g, (match, quote, content) => {
        return '"' + content + '"';
      });
      fixes.push('single quotes to double quotes');
    }
    
    // Remove comments (both single-line and multi-line)
    if (/\/\*[\s\S]*?\*\//.test(fixed)) {
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
      fixes.push('multi-line comments');
    }
    if (/\/\/.*$/m.test(fixed)) {
      fixed = fixed.replace(/\/\/.*$/gm, ''); // Single-line comments
      fixes.push('single-line comments');
    }
    
    // Fix missing quotes around property names
    if (/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/.test(fixed)) {
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
      fixes.push('unquoted property names');
    }
    
    // Fix unquoted string values (JavaScript object literal syntax)
    // This is more complex as we need to distinguish between keywords, numbers, and actual unquoted strings
    fixed = this.fixUnquotedValues(fixed, fixes);
    
    // Try to fix missing brackets FIRST (before removing trailing commas)
    const bracketResult = this.fixMissingBracketsWithDetails(fixed);
    if (bracketResult.fixes.length > 0) {
      fixed = bracketResult.fixed;
      fixes.push(...bracketResult.fixes);
    }
    
    // Remove trailing commas before closing brackets/braces
    if (/,\s*[}\]]/.test(fixed)) {
      fixed = fixed.replace(/,\s*([}\]])/g, '$1');
      fixes.push('trailing commas');
    }
    
    // Remove leading commas after opening brackets/braces
    if (/[{\[]\s*,/.test(fixed)) {
      fixed = fixed.replace(/([{\[])\s*,/g, '$1');
      fixes.push('leading commas');
    }
    
    // Fix multiple consecutive commas
    if (/,\s*,+/.test(fixed)) {
      fixed = fixed.replace(/,\s*,+/g, ',');
      fixes.push('multiple consecutive commas');
    }
    
    // Fix missing commas between properties (but not before closing brackets)
    if (/(["\d\]}\w])\s*\n\s*"([^"]+)":/.test(fixed) || /(["\d\]}\w])\s*"([^"]+)":/.test(fixed)) {
      fixed = fixed.replace(/(["\d\]}\w])\s*\n\s*"([^"]+)":/g, '$1,\n"$2":');
      fixed = fixed.replace(/(["\d\]}\w])\s*"([^"]+)":/g, '$1,"$2":');
      fixes.push('missing commas between properties');
    }
    
    return { fixed, fixes };
  }
  
  static fixMissingBrackets(str: string): string {
    const result = this.fixMissingBracketsWithDetails(str);
    return result.fixed;
  }
  
  static fixMissingBracketsWithDetails(str: string): { fixed: string, fixes: string[] } {
    const fixes: string[] = [];
    // First, check if the string has any bracket-like structure
    const hasCurlyStart = str.includes('{');
    const hasCurlyEnd = str.includes('}');
    const hasSquareStart = str.includes('[');
    const hasSquareEnd = str.includes(']');
    
    // If it looks like it should be an object but is missing opening bracket
    if (!hasCurlyStart && (str.includes('":') || hasCurlyEnd)) {
      str = '{' + str;
      fixes.push('opening brace {');
    }
    
    // If it looks like it should be an array but is missing opening bracket
    if (!hasSquareStart && hasSquareEnd && !str.includes('":')) {
      str = '[' + str;
      fixes.push('opening bracket [');
    }
    
    // Count brackets
    let openCurly = 0;
    let openSquare = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !inString) {
        inString = true;
      } else if (char === '"' && inString) {
        inString = false;
      }
      
      if (!inString) {
        if (char === '{') openCurly++;
        else if (char === '}') openCurly--;
        else if (char === '[') openSquare++;
        else if (char === ']') openSquare--;
      }
    }
    
    // Add missing closing brackets
    let result = str;
    
    // Trim any trailing whitespace and commas before adding brackets
    result = result.replace(/[\s,]+$/, '');
    
    // Add missing closing curly braces
    while (openCurly > 0) {
      result += '}';
      openCurly--;
      fixes.push('closing brace }');
    }
    
    // Add missing closing square brackets
    while (openSquare > 0) {
      result += ']';
      openSquare--;
      fixes.push('closing bracket ]');
    }
    
    // Add missing opening brackets if we have more closing than opening
    if (openCurly < 0) {
      result = '{'.repeat(-openCurly) + result;
      fixes.push(`${-openCurly} opening brace${-openCurly > 1 ? 's' : ''} {`);
    }
    
    if (openSquare < 0) {
      result = '['.repeat(-openSquare) + result;
      fixes.push(`${-openSquare} opening bracket${-openSquare > 1 ? 's' : ''} [`);
    }
    
    return { fixed: result, fixes };
  }
  
  static fixUnquotedValues(str: string, fixes: string[]): string {
    let fixed = str;
    let hasUnquotedValues = false;
    
    // More comprehensive pattern to match unquoted values
    // This handles:
    // 1. Property:value pairs
    // 2. Array elements
    // 3. Values before commas, brackets, or braces
    
    // First, fix unquoted values after colons (object properties)
    fixed = fixed.replace(
      /:\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)(?=\s*[,\]\}])/g,
      (match, value) => {
        // Skip JSON literals
        if (value === 'true' || value === 'false' || value === 'null' || value === 'undefined') {
          return match;
        }
        hasUnquotedValues = true;
        return `: "${value}"`;
      }
    );
    
    // Fix unquoted values in arrays
    fixed = fixed.replace(
      /(\[|,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)(?=\s*[,\]])/g,
      (match, prefix, value) => {
        // Skip JSON literals
        if (value === 'true' || value === 'false' || value === 'null' || value === 'undefined') {
          return match;
        }
        hasUnquotedValues = true;
        return `${prefix} "${value}"`;
      }
    );
    
    if (hasUnquotedValues) {
      fixes.push('unquoted string values');
    }
    
    return fixed;
  }
  
  static parseWithFix(jsonString: string): any {
    try {
      // First attempt: parse as-is
      return JSON.parse(jsonString);
    } catch (firstError) {
      try {
        // Second attempt: try to fix common issues
        const fixed = this.tryFixJSON(jsonString);
        return JSON.parse(fixed);
      } catch (secondError) {
        // If both attempts fail, throw the original error
        throw firstError;
      }
    }
  }
  
  static parseWithFixInfo(jsonString: string): JSONFixResult {
    if (!jsonString || jsonString.trim() === '') {
      return {
        data: null,
        wasFixed: false,
        error: 'Empty input',
      };
    }

    try {
      // First attempt: parse as-is
      const data = JSON.parse(jsonString);
      return { data, wasFixed: false };
    } catch (firstError) {
      try {
        // Second attempt: try to fix common issues
        const fixResult = this.tryFixJSONWithDetails(jsonString);
        const data = JSON.parse(fixResult.fixed);
        return { 
          data, 
          wasFixed: true, 
          fixes: fixResult.fixes 
        };
      } catch (secondError) {
        // Return with error instead of throwing
        return {
          data: null,
          wasFixed: false,
          error: firstError instanceof Error ? firstError.message : 'Invalid JSON',
        };
      }
    }
  }
}