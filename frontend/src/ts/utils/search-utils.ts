import { showSuccess } from "./notification-utils.js";

export function generateSearchView(data: any, container: HTMLElement): void {
  container.innerHTML = "";

  const searchContainer = document.createElement("div");
  searchContainer.className = "search-container";

  // Search input section
  const searchSection = document.createElement("div");
  searchSection.className = "search-section";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "search-input";
  searchInput.placeholder = "Search in JSON (text, keys, values, regex)...";

  const searchOptions = document.createElement("div");
  searchOptions.className = "search-options";

  const caseSensitive = createCheckbox("caseSensitive", "Case sensitive");
  const wholeWord = createCheckbox("wholeWord", "Whole word");
  const useRegex = createCheckbox("useRegex", "Use regex");
  const searchKeys = createCheckbox("searchKeys", "Search keys", true);
  const searchValues = createCheckbox("searchValues", "Search values", true);

  searchOptions.appendChild(caseSensitive);
  searchOptions.appendChild(wholeWord);
  searchOptions.appendChild(useRegex);
  searchOptions.appendChild(searchKeys);
  searchOptions.appendChild(searchValues);

  const searchButton = document.createElement("button");
  searchButton.className = "search-button";
  searchButton.textContent = "Search";

  const clearButton = document.createElement("button");
  clearButton.className = "search-clear-button";
  clearButton.textContent = "Clear";

  // Filter section
  const filterSection = document.createElement("div");
  filterSection.className = "filter-section";

  const filterTitle = document.createElement("h4");
  filterTitle.textContent = "Filters";
  filterSection.appendChild(filterTitle);

  const typeFilter = document.createElement("div");
  typeFilter.className = "filter-group";
  typeFilter.innerHTML = `
    <label>Value Type:</label>
    <select class="filter-type-select">
      <option value="">All Types</option>
      <option value="string">String</option>
      <option value="number">Number</option>
      <option value="boolean">Boolean</option>
      <option value="object">Object</option>
      <option value="array">Array</option>
      <option value="null">Null</option>
    </select>
  `;

  const depthFilter = document.createElement("div");
  depthFilter.className = "filter-group";
  depthFilter.innerHTML = `
    <label>Max Depth:</label>
    <input type="number" class="filter-depth-input" min="0" placeholder="No limit">
  `;

  filterSection.appendChild(typeFilter);
  filterSection.appendChild(depthFilter);

  // Results section
  const resultsSection = document.createElement("div");
  resultsSection.className = "search-results-section";

  const resultsSummary = document.createElement("div");
  resultsSummary.className = "search-results-summary";

  const resultsList = document.createElement("div");
  resultsList.className = "search-results-list";

  resultsSection.appendChild(resultsSummary);
  resultsSection.appendChild(resultsList);

  // Saved searches
  const savedSection = document.createElement("div");
  savedSection.className = "saved-searches-section";

  const savedTitle = document.createElement("h4");
  savedTitle.textContent = "Saved Searches";
  savedSection.appendChild(savedTitle);

  const savedList = document.createElement("div");
  savedList.className = "saved-searches-list";

  const saveCurrentButton = document.createElement("button");
  saveCurrentButton.className = "save-search-button";
  saveCurrentButton.textContent = "Save Current Search";
  saveCurrentButton.disabled = true;

  savedSection.appendChild(savedList);
  savedSection.appendChild(saveCurrentButton);

  // Load saved searches
  const savedSearches = loadSavedSearches();
  updateSavedSearchesList(savedSearches, savedList, searchInput, searchOptions);

  // Event handlers
  const performSearch = () => {
    const query = searchInput.value.trim();
    if (!query) {
      resultsSummary.textContent = "Enter a search query";
      resultsList.innerHTML = "";
      saveCurrentButton.disabled = true;
      return;
    }

    const options = {
      caseSensitive: (caseSensitive.querySelector("input") as HTMLInputElement).checked,
      wholeWord: (wholeWord.querySelector("input") as HTMLInputElement).checked,
      useRegex: (useRegex.querySelector("input") as HTMLInputElement).checked,
      searchKeys: (searchKeys.querySelector("input") as HTMLInputElement).checked,
      searchValues: (searchValues.querySelector("input") as HTMLInputElement).checked,
      type: (typeFilter.querySelector("select") as HTMLSelectElement).value,
      maxDepth:
        parseInt((depthFilter.querySelector("input") as HTMLInputElement).value) || Infinity,
    };

    const results = searchJSON(data, query, options);
    displaySearchResults(results, resultsList, resultsSummary, query);
    saveCurrentButton.disabled = false;
  };

  searchButton.onclick = performSearch;
  searchInput.onkeypress = (e) => {
    if (e.key === "Enter") performSearch();
  };

  clearButton.onclick = () => {
    searchInput.value = "";
    resultsList.innerHTML = "";
    resultsSummary.textContent = "";
    saveCurrentButton.disabled = true;
  };

  saveCurrentButton.onclick = () => {
    const name = prompt("Name for this search:");
    if (name) {
      const search = {
        name,
        query: searchInput.value,
        options: {
          caseSensitive: (caseSensitive.querySelector("input") as HTMLInputElement).checked,
          wholeWord: (wholeWord.querySelector("input") as HTMLInputElement).checked,
          useRegex: (useRegex.querySelector("input") as HTMLInputElement).checked,
          searchKeys: (searchKeys.querySelector("input") as HTMLInputElement).checked,
          searchValues: (searchValues.querySelector("input") as HTMLInputElement).checked,
        },
      };

      savedSearches.push(search);
      saveSavedSearches(savedSearches);
      updateSavedSearchesList(savedSearches, savedList, searchInput, searchOptions);
    }
  };

  // Assemble UI
  searchSection.appendChild(searchInput);
  searchSection.appendChild(searchOptions);
  searchSection.appendChild(searchButton);
  searchSection.appendChild(clearButton);

  searchContainer.appendChild(searchSection);
  searchContainer.appendChild(filterSection);
  searchContainer.appendChild(savedSection);
  searchContainer.appendChild(resultsSection);

  container.appendChild(searchContainer);
}

interface SearchResult {
  path: string;
  key?: string;
  value: any;
  type: string;
  depth: number;
  match: {
    type: "key" | "value";
    matchedText: string;
  };
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  searchKeys: boolean;
  searchValues: boolean;
  type: string;
  maxDepth: number;
}

function searchJSON(data: any, query: string, options: SearchOptions): SearchResult[] {
  const results: SearchResult[] = [];

  const matcher = createMatcher(query, options);

  function traverse(obj: any, path: string, depth: number) {
    if (depth > options.maxDepth) return;

    const type = getType(obj);

    if (options.type && type !== options.type) return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        traverse(item, `${path}[${index}]`, depth + 1);
      });
    } else if (typeof obj === "object" && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        // Search in keys
        if (options.searchKeys && matcher(key)) {
          results.push({
            path: `${path}.${key}`,
            key,
            value,
            type: getType(value),
            depth,
            match: {
              type: "key",
              matchedText: key,
            },
          });
        }

        traverse(value, `${path}.${key}`, depth + 1);
      });
    } else {
      // Search in values
      if (options.searchValues) {
        const stringValue = String(obj);
        if (matcher(stringValue)) {
          results.push({
            path,
            value: obj,
            type,
            depth,
            match: {
              type: "value",
              matchedText: stringValue,
            },
          });
        }
      }
    }
  }

  traverse(data, "$", 0);
  return results;
}

function createMatcher(query: string, options: SearchOptions): (text: string) => boolean {
  if (options.useRegex) {
    try {
      const flags = options.caseSensitive ? "g" : "gi";
      const regex = new RegExp(query, flags);
      return (text: string) => regex.test(text);
    } catch (e) {
      // Invalid regex, fall back to string search
      return () => false;
    }
  }

  const normalizedQuery = options.caseSensitive ? query : query.toLowerCase();

  return (text: string) => {
    const normalizedText = options.caseSensitive ? text : text.toLowerCase();

    if (options.wholeWord) {
      const wordBoundary = /\b/;
      const words = normalizedText.split(wordBoundary);
      return words.includes(normalizedQuery);
    }

    return normalizedText.includes(normalizedQuery);
  };
}

function getType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function displaySearchResults(
  results: SearchResult[],
  container: HTMLElement,
  summaryElement: HTMLElement,
  query: string
): void {
  summaryElement.textContent = `Found ${results.length} match${results.length !== 1 ? "es" : ""} for "${query}"`;

  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = '<div class="search-no-results">No matches found</div>';
    return;
  }

  results.forEach((result, index) => {
    const resultItem = document.createElement("div");
    resultItem.className = "search-result-item";

    const header = document.createElement("div");
    header.className = "search-result-header";
    header.innerHTML = `
      <span class="search-result-number">${index + 1}</span>
      <span class="search-result-path">${result.path}</span>
      <span class="search-result-type">${result.type}</span>
    `;

    const content = document.createElement("div");
    content.className = "search-result-content";

    if (result.match.type === "key") {
      content.innerHTML = `
        <div class="search-result-match">
          <strong>Key:</strong> <span class="highlight">${escapeHtml(result.key!)}</span>
        </div>
        <div class="search-result-value">
          <strong>Value:</strong> ${formatValue(result.value)}
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="search-result-match">
          <strong>Value:</strong> <span class="highlight">${escapeHtml(result.match.matchedText)}</span>
        </div>
      `;
    }

    resultItem.appendChild(header);
    resultItem.appendChild(content);

    // Click to copy path
    header.onclick = () => {
      navigator.clipboard.writeText(result.path);
      showToast("Path copied to clipboard!");
    };

    container.appendChild(resultItem);
  });
}

function formatValue(value: any): string {
  if (typeof value === "object") {
    const json = JSON.stringify(value, null, 2);
    if (json.length > 100) {
      return `<pre>${escapeHtml(json.substring(0, 100))}...</pre>`;
    }
    return `<pre>${escapeHtml(json)}</pre>`;
  }
  return escapeHtml(String(value));
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function createCheckbox(id: string, label: string, checked: boolean = false): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "search-checkbox";
  wrapper.innerHTML = `
    <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
    <span>${label}</span>
  `;
  return wrapper;
}

function loadSavedSearches(): any[] {
  const saved = localStorage.getItem("jsonViewerSavedSearches");
  return saved ? JSON.parse(saved) : [];
}

function saveSavedSearches(searches: any[]): void {
  localStorage.setItem("jsonViewerSavedSearches", JSON.stringify(searches));
}

function updateSavedSearchesList(
  searches: any[],
  container: HTMLElement,
  searchInput: HTMLInputElement,
  searchOptions: HTMLElement
): void {
  container.innerHTML = "";

  if (searches.length === 0) {
    container.innerHTML = '<div class="saved-searches-empty">No saved searches</div>';
    return;
  }

  searches.forEach((search, index) => {
    const item = document.createElement("div");
    item.className = "saved-search-item";

    const name = document.createElement("span");
    name.className = "saved-search-name";
    name.textContent = search.name;

    const query = document.createElement("span");
    query.className = "saved-search-query";
    query.textContent = search.query;

    const loadButton = document.createElement("button");
    loadButton.className = "saved-search-load";
    loadButton.textContent = "Load";
    loadButton.onclick = () => {
      searchInput.value = search.query;
      Object.entries(search.options).forEach(([key, value]) => {
        const checkbox = searchOptions.querySelector(`#${key}`) as HTMLInputElement;
        if (checkbox) checkbox.checked = value as boolean;
      });
    };

    const deleteButton = document.createElement("button");
    deleteButton.className = "saved-search-delete";
    deleteButton.textContent = "×";
    deleteButton.onclick = () => {
      searches.splice(index, 1);
      saveSavedSearches(searches);
      updateSavedSearchesList(searches, container, searchInput, searchOptions);
    };

    item.appendChild(name);
    item.appendChild(query);
    item.appendChild(loadButton);
    item.appendChild(deleteButton);
    container.appendChild(item);
  });
}

function showToast(message: string): void {
  showSuccess(message);
}
