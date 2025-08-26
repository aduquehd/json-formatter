# Language Auto-Detection Testing Guide

## Quick Test Methods

### 1. Chrome DevTools Sensors (Recommended)
1. Open your site: http://localhost:3000
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Press **Cmd+Shift+P** (Mac) or **Ctrl+Shift+P** (Windows)
4. Type "Show Sensors" and select it
5. In the Sensors panel, find **"Locale"** dropdown
6. Select different languages:
   - `zh` or `zh-CN` - Mandarin Chinese
   - `es` or `es-ES` - Spanish  
   - `hi` or `hi-IN` - Hindi
   - `tr` or `tr-TR` - Turkish
   - `nl` or `nl-NL` - Dutch
   - `ms` or `ms-MY` - Malay
   - `ta` or `ta-IN` - Tamil
7. **Refresh the page** to trigger auto-detection

### 2. Chrome with Language Flag (Mac/Linux)
```bash
# Mandarin Chinese
open -na "Google Chrome" --args --lang=zh --user-data-dir="/tmp/chrome-zh" http://localhost:3000

# Spanish
open -na "Google Chrome" --args --lang=es --user-data-dir="/tmp/chrome-es" http://localhost:3000

# Hindi
open -na "Google Chrome" --args --lang=hi --user-data-dir="/tmp/chrome-hi" http://localhost:3000
```

### 3. Chrome Settings Change
1. Go to Chrome Settings → Advanced → Languages
2. Add Chinese (Simplified) or other languages
3. Move it to the top of the list
4. Click "Display Google Chrome in this language"
5. Restart Chrome
6. Open your site in an incognito window (to bypass localStorage)

### 4. Browser Console Override (Temporary)
```javascript
// Run this in console before page loads
Object.defineProperty(navigator, 'language', {
    get: function() { return 'zh'; }
});
Object.defineProperty(navigator, 'languages', {
    get: function() { return ['zh', 'zh-CN']; }
});
// Then refresh the page
```

## Testing Checklist

- [ ] Open site in incognito/private mode (to test fresh detection)
- [ ] Browser language set to Mandarin → Site shows in Chinese
- [ ] Browser language set to Spanish → Site shows in Spanish
- [ ] Browser language set to unsupported language → Site shows in English
- [ ] Manual language selection persists after refresh
- [ ] Language selector shows correct flag and checkmark
- [ ] All UI elements are translated properly

## Expected Behavior

1. **First Visit**: Site detects browser language automatically
2. **Manual Selection**: User picks language from dropdown
3. **Return Visit**: Site remembers user's selection (localStorage)
4. **Priority**: Manual selection > localStorage > Browser language > English

## Verification Commands

Run this to see what language the browser reports:
```javascript
console.log('Browser Language:', navigator.language);
console.log('All Languages:', navigator.languages);
console.log('Stored Language:', localStorage.getItem('i18nextLng'));
```

## Reset Language Selection

To clear the saved language preference:
```javascript
localStorage.removeItem('i18nextLng');
location.reload();
```