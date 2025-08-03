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
