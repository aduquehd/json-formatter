export class JSONFixer {
  static parseWithFixInfo(jsonString: string): {
    data: any;
    wasFixed: boolean;
    fixes?: string[];
    error?: string;
  } {
    if (!jsonString || jsonString.trim() === '') {
      return {
        data: null,
        wasFixed: false,
        error: 'Empty input',
      };
    }

    const fixes: string[] = [];
    let wasFixed = false;
    let fixedString = jsonString.trim();

    try {
      // Try to parse as-is first
      const data = JSON.parse(fixedString);
      return {
        data,
        wasFixed: false,
      };
    } catch (error) {
      // Apply fixes
      wasFixed = true;

      // Fix trailing commas
      if (fixedString.match(/,\s*[}\]]/)) {
        fixes.push('Removed trailing commas');
        fixedString = fixedString.replace(/,(\s*[}\]])/g, '$1');
      }

      // Fix single quotes (but be careful with strings containing apostrophes)
      const singleQuoteRegex = /(^|[^\\])'/g;
      if (fixedString.match(singleQuoteRegex)) {
        fixes.push('Replaced single quotes with double quotes');
        // Replace single quotes that are not escaped
        fixedString = fixedString.replace(/([^\\])'/g, '$1"');
        fixedString = fixedString.replace(/^'/g, '"');
      }

      // Fix unquoted keys
      const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g;
      if (fixedString.match(unquotedKeyRegex)) {
        fixes.push('Added quotes to unquoted keys');
        fixedString = fixedString.replace(unquotedKeyRegex, '$1"$2"$3');
      }

      // Fix missing commas between properties
      const missingCommaRegex = /}\s*"/g;
      if (fixedString.match(missingCommaRegex)) {
        fixes.push('Added missing commas');
        fixedString = fixedString.replace(missingCommaRegex, '},"');
      }

      try {
        const data = JSON.parse(fixedString);
        return {
          data,
          wasFixed,
          fixes,
        };
      } catch (finalError) {
        // Return with error instead of throwing
        return {
          data: null,
          wasFixed: false,
          error: finalError instanceof Error ? finalError.message : 'Invalid JSON',
        };
      }
    }
  }
}