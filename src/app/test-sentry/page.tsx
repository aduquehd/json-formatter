'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function TestSentryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const isProduction = process.env.NODE_ENV === 'production';
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  const triggerClientError = () => {
    throw new Error('Test Client Error: This is a test error from the client side!');
  };

  const triggerAsyncError = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Test Async Error: This is an async error!');
  };

  const triggerHandledError = () => {
    try {
      throw new Error('Test Handled Error: This error is caught and reported manually');
    } catch (error) {
      Sentry.captureException(error);
      alert('Error captured and sent to Sentry (if in production)');
    }
  };

  const triggerTypeError = () => {
    // @ts-ignore - Intentional type error for testing
    const result = undefined.nonExistentMethod();
    return result;
  };

  const triggerRangeError = () => {
    const arr = new Array(-1); // RangeError
    return arr;
  };

  const triggerApiError = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-sentry-error');
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = () => {
    Sentry.captureMessage('Test Message: This is a test message sent to Sentry', 'info');
    alert('Test message sent to Sentry (if in production)');
  };

  const sendCustomEvent = () => {
    Sentry.captureEvent({
      message: 'Custom Test Event',
      level: 'warning',
      tags: {
        section: 'test-sentry',
        test: true,
      },
      extra: {
        testData: 'This is test data',
        timestamp: new Date().toISOString(),
      },
    });
    alert('Custom event sent to Sentry (if in production)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Sentry Test Page</h1>
        
        {/* Status Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Sentry Status</h2>
          <div className="space-y-2">
            <p className="flex items-center">
              <span className="font-medium mr-2">Environment:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isProduction ? 'bg-green-600' : 'bg-yellow-600'
              }`}>
                {isProduction ? 'Production' : 'Development'}
              </span>
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">Sentry Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isProduction ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                {isProduction ? 'Active' : 'Disabled (Dev Mode)'}
              </span>
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">DSN Configured:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                sentryDsn ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {sentryDsn ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
          {!isProduction && (
            <div className="mt-4 p-4 bg-yellow-900/50 rounded-lg border border-yellow-600">
              <p className="text-yellow-200">
                ⚠️ Sentry is disabled in development mode. Build and run in production mode to test:
              </p>
              <pre className="mt-2 text-sm bg-black/50 p-2 rounded">
                <code>pnpm build && pnpm start</code>
              </pre>
            </div>
          )}
          {isProduction && !sentryDsn && (
            <div className="mt-4 p-4 bg-red-900/50 rounded-lg border border-red-600">
              <p className="text-red-200">
                ❌ Sentry DSN is not configured. Add NEXT_PUBLIC_SENTRY_DSN to your environment variables.
              </p>
            </div>
          )}
        </div>

        {/* Test Buttons Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Error Test Buttons</h2>
          <p className="text-gray-400 mb-6">
            Click any button below to trigger different types of errors. 
            {isProduction ? ' Errors will be sent to Sentry.' : ' In development, errors will be logged to console.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={triggerClientError}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              🔥 Trigger Client Error
            </button>

            <button
              onClick={triggerAsyncError}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              ⚡ Trigger Async Error
            </button>

            <button
              onClick={triggerHandledError}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              🎯 Trigger Handled Error
            </button>

            <button
              onClick={triggerTypeError}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              ❌ Trigger TypeError
            </button>

            <button
              onClick={triggerRangeError}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              📏 Trigger RangeError
            </button>

            <button
              onClick={triggerApiError}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              🌐 Trigger API Error
            </button>

            <button
              onClick={sendTestMessage}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              📨 Send Test Message
            </button>

            <button
              onClick={sendCustomEvent}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              📊 Send Custom Event
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-900 rounded-lg">
            <h3 className="font-semibold mb-2">📋 How to verify Sentry is working:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
              <li>Build and start in production mode: <code className="bg-black/50 px-2 py-1 rounded">pnpm build && pnpm start</code></li>
              <li>Visit this page at <code className="bg-black/50 px-2 py-1 rounded">http://localhost:3000/test-sentry</code></li>
              <li>Click any error button above</li>
              <li>Go to your Sentry dashboard at <a href="https://ad-capital.sentry.io" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">https://ad-capital.sentry.io</a></li>
              <li>Check the "Issues" section for your json-formatter project</li>
              <li>You should see the error appear within a few seconds</li>
            </ol>
          </div>

          {/* Cleanup Note */}
          <div className="mt-6 p-4 bg-yellow-900/30 rounded-lg border border-yellow-600/50">
            <p className="text-yellow-200 text-sm">
              ⚠️ Remember to remove or protect this test page before deploying to production!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}