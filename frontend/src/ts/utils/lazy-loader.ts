interface ModuleCache {
  [key: string]: any;
}

const moduleCache: ModuleCache = {};
const loadingPromises: { [key: string]: Promise<any> } = {};

export async function lazyLoadModule(modulePath: string): Promise<any> {
  // Return cached module if already loaded
  if (moduleCache[modulePath]) {
    return moduleCache[modulePath];
  }

  // Return existing loading promise if module is currently being loaded
  if (modulePath in loadingPromises) {
    return loadingPromises[modulePath];
  }

  // Start loading the module
  loadingPromises[modulePath] = import(modulePath)
    .then((module) => {
      moduleCache[modulePath] = module;
      delete loadingPromises[modulePath];
      return module;
    })
    .catch((error) => {
      delete loadingPromises[modulePath];
      throw error;
    });

  return loadingPromises[modulePath];
}

// Specific lazy loaders for each module
export async function loadTreeUtils() {
  return lazyLoadModule("./tree-utils.js");
}

export async function loadGraphUtils() {
  return lazyLoadModule("./graph-utils.js");
}

export async function loadDiffUtils() {
  return lazyLoadModule("./diff-utils.js");
}

export async function loadStatsUtils() {
  return lazyLoadModule("./stats-utils.js");
}

export async function loadChartUtils() {
  return lazyLoadModule("./chart-utils.js");
}

export async function loadSearchUtils() {
  return lazyLoadModule("./search-utils.js");
}

export async function loadMapUtils() {
  return lazyLoadModule("./map-utils.js");
}

export async function loadJsonExampleUtils() {
  return lazyLoadModule("./json-example-utils.js");
}

// Lazy load external libraries
let d3LoadingPromise: Promise<void> | null = null;

export async function loadD3Library(): Promise<void> {
  // Return if D3 is already loaded
  if (typeof (window as any).d3 !== "undefined") {
    return Promise.resolve();
  }

  // Return existing loading promise if D3 is currently being loaded
  if (d3LoadingPromise) {
    return d3LoadingPromise;
  }

  // Start loading D3
  d3LoadingPromise = new Promise((resolve, reject) => {
    // Save the current define function (from Monaco/RequireJS)
    const originalDefine = (window as any).define;

    // Temporarily remove define to force D3 to load as global
    (window as any).define = undefined;

    const script = document.createElement("script");
    // Use jsdelivr CDN which is allowed by CSP and provides UMD builds
    script.src = "https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js";
    script.async = true;

    script.onload = () => {
      // Restore the original define function
      (window as any).define = originalDefine;

      // Check if D3 loaded successfully
      if (typeof (window as any).d3 !== "undefined") {
        d3LoadingPromise = null;
        resolve();
      } else {
        console.error("D3 script loaded but d3 is not available on window");
        d3LoadingPromise = null;
        reject(new Error("D3 loaded but not available"));
      }
    };

    script.onerror = () => {
      // Restore define on error
      (window as any).define = originalDefine;
      console.error("Failed to load D3 script");
      d3LoadingPromise = null;
      reject(new Error("Failed to load D3 library"));
    };

    document.head.appendChild(script);
  });

  return d3LoadingPromise;
}
