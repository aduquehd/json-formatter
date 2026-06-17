// Suppress the specific (benign) Monaco Editor messages that appear when workers
// are intentionally disabled. Scoped to exact known phrases so genuine app errors
// — including unrelated ones that merely mention "worker" — are still logged.
(function () {
  if (typeof window === 'undefined') return;

  // Exact phrases emitted by Monaco when running without web workers.
  var MONACO_NOISE = [
    'Could not create web worker',
    'Falling back to loading web worker',
    'You must define a function MonacoEnvironment.getWorkerUrl',
    'FAILED to post message',
    'postMessage is not a function',
  ];

  function isMonacoNoise(args) {
    var message = args && args[0] ? String(args[0]) : '';
    return MONACO_NOISE.some(function (phrase) {
      return message.indexOf(phrase) !== -1;
    });
  }

  var originalWarn = console.warn;
  console.warn = function () {
    if (isMonacoNoise(arguments)) return;
    originalWarn.apply(console, arguments);
  };

  var originalError = console.error;
  console.error = function () {
    if (isMonacoNoise(arguments)) return;
    originalError.apply(console, arguments);
  };

  // Disable Monaco web workers — runs the editor in synchronous mode (reliable,
  // and avoids worker/CORS issues). Monaco assets are served same-origin.
  window.MonacoEnvironment = {
    getWorkerUrl: function () {
      return 'data:text/javascript;charset=utf-8,';
    },
  };

  // Swallow only the matching uncaught worker errors; let everything else through.
  var originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (
      typeof message === 'string' &&
      MONACO_NOISE.some(function (phrase) {
        return message.indexOf(phrase) !== -1;
      })
    ) {
      return true; // Prevent default error handling for this known-benign case.
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
})();
