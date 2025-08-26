// Run these commands in the browser console to debug:

console.log('Browser Language:', navigator.language);
console.log('All Languages:', navigator.languages);
console.log('Stored Language:', localStorage.getItem('i18nextLng'));

// To clear stored language and test auto-detection:
localStorage.removeItem('i18nextLng');
console.log('Cleared stored language. Refreshing...');
location.reload();