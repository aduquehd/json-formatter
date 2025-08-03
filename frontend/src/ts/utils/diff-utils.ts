declare var monaco: any;
declare var require: any;

let leftEditor: any = null;
let rightEditor: any = null;

export function generateDiffView(data: any, container: HTMLElement): void {
  container.innerHTML = "";

  const diffContainer = document.createElement("div");
  diffContainer.className = "diff-container";

  // Input section for two JSONs
  const inputSection = document.createElement("div");
  inputSection.className = "diff-input-section";

  const leftPanel = createDiffPanel("Left JSON", "left");
  const rightPanel = createDiffPanel("Right JSON", "right");

  inputSection.appendChild(leftPanel);
  inputSection.appendChild(rightPanel);

  // Compare button
  const compareSection = document.createElement("div");
  compareSection.className = "diff-compare-section";

  const compareButton = document.createElement("button");
  compareButton.className = "diff-compare-button";
  compareButton.textContent = "Compare JSONs";

  compareSection.appendChild(compareButton);

  // Results section
  const resultsSection = document.createElement("div");
  resultsSection.className = "diff-results-section";
  resultsSection.style.display = "none";

  diffContainer.appendChild(inputSection);
  diffContainer.appendChild(compareSection);
  diffContainer.appendChild(resultsSection);

  container.appendChild(diffContainer);

  // Initialize Monaco editors after DOM is ready
  setTimeout(() => {
    initializeDiffEditors(leftPanel, rightPanel, data);
  }, 100);

  // Event handlers
  compareButton.onclick = () => {
    if (!leftEditor || !rightEditor) {
      return;
    }

    try {
      const leftData = JSON.parse(leftEditor.getValue() || "{}");
      const rightData = JSON.parse(rightEditor.getValue() || "{}");

      const differences = compareJSON(leftData, rightData);
      displayDifferences(differences, resultsSection);
      resultsSection.style.display = "block";
    } catch (error) {
      alert("Invalid JSON. Please check both inputs.");
    }
  };
}

function createDiffPanel(title: string, side: string): HTMLElement {
  const panel = document.createElement("div");
  panel.className = `diff-panel diff-panel-${side}`;

  const header = document.createElement("h4");
  header.textContent = title;
  panel.appendChild(header);

  // Create container for Monaco editor
  const editorContainer = document.createElement("div");
  editorContainer.className = `diff-editor-container diff-editor-${side}`;
  editorContainer.style.height = "300px";
  editorContainer.style.border = "1px solid var(--border-color)";
  editorContainer.style.borderRadius = "6px";
  panel.appendChild(editorContainer);

  // Create button group for format and compact
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "diff-button-group";

  const formatButton = document.createElement("button");
  formatButton.className = "diff-action-button diff-format-button";
  formatButton.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="16,18 22,12 16,6"></polyline>
      <polyline points="8,6 2,12 8,18"></polyline>
    </svg>
    Format JSON
  `;
  formatButton.setAttribute("data-side", side);
  formatButton.setAttribute("data-action", "format");

  const compactButton = document.createElement("button");
  compactButton.className = "diff-action-button diff-compact-button";
  compactButton.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="4,14 10,14 10,20"></polyline>
      <polyline points="20,10 14,10 14,4"></polyline>
      <line x1="14" y1="10" x2="21" y2="3"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
    Compact JSON
  `;
  compactButton.setAttribute("data-side", side);
  compactButton.setAttribute("data-action", "compact");

  buttonGroup.appendChild(formatButton);
  buttonGroup.appendChild(compactButton);
  panel.appendChild(buttonGroup);

  return panel;
}

function initializeDiffEditors(leftPanel: HTMLElement, rightPanel: HTMLElement, initialData?: any): void {
  // Check if Monaco is available
  if (typeof monaco === "undefined" || !monaco) {
    console.error("Monaco editor is not loaded");
    return;
  }

  // Get the current theme from localStorage or default
  const savedTheme = localStorage.getItem("editorTheme") || "vs-dark";
  const isDarkTheme = document.documentElement.classList.contains("dark");
  
  // Determine which Monaco theme to use
  let monacoTheme = savedTheme;
  if (savedTheme === "default") {
    monacoTheme = isDarkTheme ? "custom-dark" : "custom-light";
  }

  // Create left editor
  const leftContainer = leftPanel.querySelector(".diff-editor-left") as HTMLElement;
  if (leftContainer && !leftEditor) {
    leftEditor = monaco.editor.create(leftContainer, {
      value: initialData ? JSON.stringify(initialData, null, 2) : "",
      language: "json",
      theme: monacoTheme,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
      fontLigatures: true,
      lineHeight: 1.7,
      minimap: {
        enabled: false,
      },
      folding: true,
      lineNumbers: "on",
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      wrappingStrategy: "advanced",
      formatOnPaste: true,
      formatOnType: true,
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      autoIndent: "full",
      tabSize: 2,
      insertSpaces: true,
      trimAutoWhitespace: true,
      matchBrackets: "always",
      bracketPairColorization: {
        enabled: true,
      },
      padding: {
        top: 10,
        bottom: 10,
      },
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });
  }

  // Create right editor
  const rightContainer = rightPanel.querySelector(".diff-editor-right") as HTMLElement;
  if (rightContainer && !rightEditor) {
    rightEditor = monaco.editor.create(rightContainer, {
      value: "",
      language: "json",
      theme: monacoTheme,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
      fontLigatures: true,
      lineHeight: 1.7,
      minimap: {
        enabled: false,
      },
      folding: true,
      lineNumbers: "on",
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      wrappingStrategy: "advanced",
      formatOnPaste: true,
      formatOnType: true,
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      autoIndent: "full",
      tabSize: 2,
      insertSpaces: true,
      trimAutoWhitespace: true,
      matchBrackets: "always",
      bracketPairColorization: {
        enabled: true,
      },
      padding: {
        top: 10,
        bottom: 10,
      },
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });
  }

  // Add action button handlers
  const actionButtons = document.querySelectorAll(".diff-action-button");
  actionButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const side = target.getAttribute("data-side");
      const action = target.getAttribute("data-action");
      const editor = side === "left" ? leftEditor : rightEditor;
      
      if (editor) {
        try {
          const data = JSON.parse(editor.getValue() || "{}");
          if (action === "format") {
            editor.setValue(JSON.stringify(data, null, 2));
          } else if (action === "compact") {
            editor.setValue(JSON.stringify(data));
          }
        } catch (error) {
          // Invalid JSON, show error using toastr if available
          if ((window as any).toastr) {
            (window as any).toastr.error("Invalid JSON format", "Error");
          }
        }
      }
    });
  });
}

// Clean up editors when switching away from diff view
export function cleanupDiffEditors(): void {
  if (leftEditor) {
    leftEditor.dispose();
    leftEditor = null;
  }
  if (rightEditor) {
    rightEditor.dispose();
    rightEditor = null;
  }
}

// Update theme for diff editors
export function updateDiffEditorsTheme(themeName: string): void {
  if (leftEditor && monaco) {
    monaco.editor.setTheme(themeName);
  }
  // Note: Setting theme on one editor sets it globally for all Monaco instances
}

interface DiffResult {
  path: string;
  type: "added" | "removed" | "modified" | "type-changed";
  leftValue?: any;
  rightValue?: any;
}

function compareJSON(left: any, right: any, path: string = "$"): DiffResult[] {
  const differences: DiffResult[] = [];

  if (left === right) {
    return differences;
  }

  if (typeof left !== typeof right) {
    differences.push({
      path,
      type: "type-changed",
      leftValue: left,
      rightValue: right,
    });
    return differences;
  }

  if (typeof left !== "object" || left === null || right === null) {
    differences.push({
      path,
      type: "modified",
      leftValue: left,
      rightValue: right,
    });
    return differences;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length);
    for (let i = 0; i < maxLength; i++) {
      if (i >= left.length) {
        differences.push({
          path: `${path}[${i}]`,
          type: "added",
          rightValue: right[i],
        });
      } else if (i >= right.length) {
        differences.push({
          path: `${path}[${i}]`,
          type: "removed",
          leftValue: left[i],
        });
      } else {
        differences.push(...compareJSON(left[i], right[i], `${path}[${i}]`));
      }
    }
  } else {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

    for (const key of allKeys) {
      const keyPath = `${path}.${key}`;

      if (!(key in left)) {
        differences.push({
          path: keyPath,
          type: "added",
          rightValue: right[key],
        });
      } else if (!(key in right)) {
        differences.push({
          path: keyPath,
          type: "removed",
          leftValue: left[key],
        });
      } else {
        differences.push(...compareJSON(left[key], right[key], keyPath));
      }
    }
  }

  return differences;
}

function displayDifferences(differences: DiffResult[], container: HTMLElement): void {
  container.innerHTML = "";

  if (differences.length === 0) {
    container.innerHTML = '<div class="diff-no-changes">No differences found</div>';
    return;
  }

  const summary = document.createElement("div");
  summary.className = "diff-summary";

  const added = differences.filter((d) => d.type === "added").length;
  const removed = differences.filter((d) => d.type === "removed").length;
  const modified = differences.filter((d) => d.type === "modified").length;
  const typeChanged = differences.filter((d) => d.type === "type-changed").length;

  summary.innerHTML = `
    <h4>Summary</h4>
    <div class="diff-stats">
      <span class="diff-stat diff-added">+${added} added</span>
      <span class="diff-stat diff-removed">-${removed} removed</span>
      <span class="diff-stat diff-modified">~${modified} modified</span>
      <span class="diff-stat diff-type-changed">⚡${typeChanged} type changed</span>
    </div>
  `;

  container.appendChild(summary);

  const diffList = document.createElement("div");
  diffList.className = "diff-list";

  differences.forEach((diff) => {
    const diffItem = document.createElement("div");
    diffItem.className = `diff-item diff-${diff.type}`;

    const pathElement = document.createElement("div");
    pathElement.className = "diff-path";
    pathElement.textContent = diff.path;

    const valuesElement = document.createElement("div");
    valuesElement.className = "diff-values";

    switch (diff.type) {
      case "added":
        valuesElement.innerHTML = `
          <div class="diff-value diff-right">
            <span class="diff-label">Added:</span>
            <pre>${JSON.stringify(diff.rightValue, null, 2)}</pre>
          </div>
        `;
        break;

      case "removed":
        valuesElement.innerHTML = `
          <div class="diff-value diff-left">
            <span class="diff-label">Removed:</span>
            <pre>${JSON.stringify(diff.leftValue, null, 2)}</pre>
          </div>
        `;
        break;

      case "modified":
      case "type-changed":
        valuesElement.innerHTML = `
          <div class="diff-value diff-left">
            <span class="diff-label">Before:</span>
            <pre>${JSON.stringify(diff.leftValue, null, 2)}</pre>
          </div>
          <div class="diff-value diff-right">
            <span class="diff-label">After:</span>
            <pre>${JSON.stringify(diff.rightValue, null, 2)}</pre>
          </div>
        `;
        break;
    }

    diffItem.appendChild(pathElement);
    diffItem.appendChild(valuesElement);
    diffList.appendChild(diffItem);
  });

  container.appendChild(diffList);
}
