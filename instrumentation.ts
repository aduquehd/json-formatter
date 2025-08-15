import * as Sentry from '@sentry/nextjs';

// Export the request error hook for nested React Server Components
export const onRequestError = Sentry.captureRequestError;

export async function register() {
  // Only initialize Sentry in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side configuration
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,
      
      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime configuration
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,
      
      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }
}