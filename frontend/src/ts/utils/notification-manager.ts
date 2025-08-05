export class NotificationManager {
    private static lastFixNotification: { timestamp: number; fixes: string[] } | null = null;
    private static NOTIFICATION_COOLDOWN = 1000; // 1 second cooldown for same fixes
    
    static shouldShowFixNotification(fixes: string[]): boolean {
        if (!this.lastFixNotification) {
            this.lastFixNotification = { timestamp: Date.now(), fixes };
            return true;
        }
        
        const now = Date.now();
        const timeDiff = now - this.lastFixNotification.timestamp;
        
        // If it's been more than cooldown period, show notification
        if (timeDiff > this.NOTIFICATION_COOLDOWN) {
            this.lastFixNotification = { timestamp: now, fixes };
            return true;
        }
        
        // If fixes are different, show notification
        const sameFixesApplied = 
            fixes.length === this.lastFixNotification.fixes.length &&
            fixes.every(fix => this.lastFixNotification!.fixes.includes(fix));
            
        if (!sameFixesApplied) {
            this.lastFixNotification = { timestamp: now, fixes };
            return true;
        }
        
        // Same fixes within cooldown period, don't show
        return false;
    }
    
    static getFixDescription(fixes: string[]): string {
        if (fixes.length === 0) return '';
        
        // Map fix types to user-friendly descriptions
        const fixDescriptions: { [key: string]: string } = {
            'trailing commas': 'removed trailing commas',
            'opening brace {': 'added missing opening brace {',
            'closing brace }': 'added missing closing brace }',
            'opening bracket [': 'added missing opening bracket [',
            'closing bracket ]': 'added missing closing bracket ]',
            'unquoted property names': 'added quotes to property names',
            'single quotes to double quotes': 'converted single quotes to double quotes',
            'smart quotes': 'fixed smart quotes',
            'smart double quotes': 'fixed smart double quotes',
            'multi-line comments': 'removed multi-line comments',
            'single-line comments': 'removed single-line comments',
            'leading commas': 'removed leading commas',
            'multiple consecutive commas': 'fixed multiple consecutive commas',
            'missing commas between properties': 'added missing commas between properties',
            'BOM character': 'removed BOM character',
            'multiple opening braces': 'fixed multiple opening braces {{',
            'multiple closing braces': 'fixed multiple closing braces }}',
            'multiple opening brackets': 'fixed multiple opening brackets [[',
            'multiple closing brackets': 'fixed multiple closing brackets ]]',
            'unquoted string values': 'added quotes to string values'
        };
        
        const descriptions = fixes.map(fix => {
            // Handle special cases like "2 opening braces {"
            const match = fix.match(/^(\d+) (.+)$/);
            if (match) {
                const [, count, type] = match;
                return fixDescriptions[type] || fix;
            }
            return fixDescriptions[fix] || fix;
        });
        
        if (descriptions.length === 1) {
            return descriptions[0];
        } else if (descriptions.length === 2) {
            return `${descriptions[0]} and ${descriptions[1]}`;
        } else {
            const lastDescription = descriptions.pop();
            return `${descriptions.join(', ')}, and ${lastDescription}`;
        }
    }
}