// Hotjar helper functions
export const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;

// Check if Hotjar is enabled
export const isHotjarEnabled = Boolean(HOTJAR_ID);

// Hotjar API functions (if needed in the future)
declare global {
  interface Window {
    hj?: (command: string, ...args: any[]) => void;
  }
}

// Trigger a Hotjar event
export const hotjarTrigger = (eventName: string) => {
  if (!isHotjarEnabled || typeof window === 'undefined' || !window.hj) return;
  
  try {
    window.hj('trigger', eventName);
  } catch (error) {
    console.error('Hotjar trigger error:', error);
  }
};

// Identify user (if you have user authentication in the future)
export const hotjarIdentify = (userId: string, attributes?: Record<string, any>) => {
  if (!isHotjarEnabled || typeof window === 'undefined' || !window.hj) return;
  
  try {
    window.hj('identify', userId, attributes || {});
  } catch (error) {
    console.error('Hotjar identify error:', error);
  }
};

// Track virtual page view (useful for SPAs)
export const hotjarVirtualPageView = (pageName: string) => {
  if (!isHotjarEnabled || typeof window === 'undefined' || !window.hj) return;
  
  try {
    window.hj('vpv', pageName);
  } catch (error) {
    console.error('Hotjar virtual page view error:', error);
  }
};

// State change (for tracking user flow)
export const hotjarStateChange = (relativePath: string) => {
  if (!isHotjarEnabled || typeof window === 'undefined' || !window.hj) return;
  
  try {
    window.hj('stateChange', relativePath);
  } catch (error) {
    console.error('Hotjar state change error:', error);
  }
};