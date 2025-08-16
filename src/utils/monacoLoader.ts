import { loader } from '@monaco-editor/react';

// Configure Monaco Editor to load from CDN
export function configureMonacoLoader() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  // Use unpkg CDN which is more reliable
  loader.config({
    paths: {
      vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs'
    }
  });
}

// Disable workers to avoid CORS and network issues
export function configureMonacoEnvironment() {
  if (typeof window === 'undefined') return;

  // Explicitly disable workers - Monaco will run in synchronous mode
  // This is more reliable and avoids all worker-related errors
  (window as any).MonacoEnvironment = {
    // Return undefined to disable workers
    getWorker: () => undefined,
    // Alternative method to disable workers
    getWorkerUrl: () => undefined
  };
}

// Initialize Monaco with workers disabled for reliability
export function initializeMonaco() {
  // Configure environment to disable workers
  try {
    configureMonacoEnvironment();
    console.info('Monaco Editor: Running in synchronous mode (workers disabled for reliability)');
  } catch (error) {
    console.warn('Monaco environment configuration warning:', error);
  }
  
  // Configure the loader
  configureMonacoLoader();
}