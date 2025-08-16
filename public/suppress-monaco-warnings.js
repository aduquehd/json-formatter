// Suppress Monaco Editor worker warnings and errors
(function() {
  if (typeof window !== 'undefined') {
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalError = console.error;
    
    // Override console.warn
    console.warn = function(...args) {
      const message = args[0] ? args[0].toString() : '';
      if (message.includes('Could not create web worker') || 
          message.includes('Falling back to loading web worker') ||
          message.includes('monaco') ||
          message.includes('worker')) {
        return; // Suppress Monaco warnings
      }
      originalWarn.apply(console, args);
    };
    
    // Override console.log for Monaco specific messages
    console.log = function(...args) {
      const message = args[0] ? args[0].toString() : '';
      if (message.includes('Could not create web worker') || 
          message.includes('Monaco Editor: Workers disabled')) {
        return; // Suppress Monaco logs
      }
      originalLog.apply(console, args);
    };
    
    // Override console.error for Monaco worker errors
    console.error = function(...args) {
      const message = args[0] ? args[0].toString() : '';
      if (message.includes('FAILED to post message') || 
          message.includes('postMessage is not a function') ||
          message.includes('worker') ||
          message.includes('Worker')) {
        return; // Suppress Monaco worker errors
      }
      originalError.apply(console, args);
    };
    
    // Completely disable Monaco workers by not providing getWorker
    window.MonacoEnvironment = {
      // Don't provide getWorker at all - this forces synchronous mode
      getWorkerUrl: function() { 
        return 'data:text/javascript;charset=utf-8,'; 
      }
    };
    
    // Also suppress uncaught errors from Monaco workers
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (typeof message === 'string' && 
          (message.includes('FAILED to post message') || 
           message.includes('postMessage is not a function') ||
           message.includes('worker'))) {
        return true; // Prevent default error handling
      }
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };
  }
})();