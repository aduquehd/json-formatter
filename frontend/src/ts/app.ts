"use strict";

// Tree utils are loaded dynamically when needed
import {
  loadTreeUtils,
  loadGraphUtils,
  loadDiffUtils,
  loadStatsUtils,
  loadChartUtils,
  loadSearchUtils,
  loadMapUtils,
  loadJsonExampleUtils,
  loadD3Library,
} from "./utils/lazy-loader.js";
import { initializeTheme, toggleTheme, updateThemeButtonText } from "./utils/theme-utils.js";
import { initializeMonacoEditor, setMonacoTheme } from "./utils/monaco-utils.js";
import { formatJSONInEditor, compactJSONInEditor, clearEditor } from "./utils/json-utils.js";
import { copyEditorContent, pasteIntoEditor } from "./utils/clipboard-utils.js";
import { updateViews, clearViews, validateAndUpdateViews } from "./utils/view-utils.js";
import { showSuccess } from "./utils/notification-utils.js";

interface AppState {
  editor: any | null;
  currentTab: string;
  isDarkTheme: boolean;
}

interface ViewCache {
  jsonHash: string;
  generatedTabs: Set<string>;
}

class JSONViewer {
  private state: AppState;
  private isUpdatingFromTree: boolean = false;
  private viewCache: ViewCache = {
    jsonHash: "",
    generatedTabs: new Set(),
  };
  private elements: {
    formatBtn: HTMLElement;
    compactBtn: HTMLElement;
    clearBtn: HTMLElement;
    copyBtn: HTMLElement;
    pasteBtn: HTMLElement;
    themeBtn: HTMLElement;
    mobileThemeBtn: HTMLElement | null;
    jsonExampleBtn: HTMLElement;
    tabBtns: NodeListOf<HTMLElement>;
    treeOutput: HTMLElement;
    graphOutput: HTMLElement;
    diffOutput: HTMLElement;
    statsOutput: HTMLElement;
    mapOutput: HTMLElement;
    chartOutput: HTMLElement;
    searchOutput: HTMLElement;
    expandAllBtn: HTMLElement | null;
    collapseAllBtn: HTMLElement | null;
  };

  constructor() {
    this.state = {
      editor: null,
      currentTab: "formatted",
      isDarkTheme: false,
    };

    this.elements = {
      formatBtn: document.getElementById("formatBtn")!,
      compactBtn: document.getElementById("compactBtn")!,
      clearBtn: document.getElementById("clearBtn")!,
      copyBtn: document.getElementById("copyBtn")!,
      pasteBtn: document.getElementById("pasteBtn")!,
      themeBtn: document.getElementById("themeBtn")!,
      mobileThemeBtn: document.getElementById("mobileThemeBtn"),
      jsonExampleBtn: document.getElementById("jsonExampleBtn")!,
      tabBtns: document.querySelectorAll(".tab-btn"),
      treeOutput: document.getElementById("treeOutput")!,
      graphOutput: document.getElementById("graphOutput")!,
      diffOutput: document.getElementById("diffOutput")!,
      statsOutput: document.getElementById("statsOutput")!,
      mapOutput: document.getElementById("mapOutput")!,
      chartOutput: document.getElementById("chartOutput")!,
      searchOutput: document.getElementById("searchOutput")!,
      expandAllBtn: document.getElementById("expandAllBtn"),
      collapseAllBtn: document.getElementById("collapseAllBtn"),
    };

    this.initializeTheme();
    this.bindEvents();

    // Use requestAnimationFrame to avoid forced reflows during initialization
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.initializeMonacoEditor();
      });
    });
  }

  private initializeTheme(): void {
    const themeState = initializeTheme();
    this.state.isDarkTheme = themeState.isDarkTheme;
    updateThemeButtonText(this.elements.themeBtn, this.state.isDarkTheme);
  }

  private async initializeMonacoEditor(): Promise<void> {
    if (this.state.editor) {
      return;
    }

    const container = document.getElementById("monaco-editor")!;

    // Pre-calculate dimensions to avoid reflows
    const containerRect = container.getBoundingClientRect();
    container.style.width = `${containerRect.width}px`;
    container.style.height = `${containerRect.height}px`;

    this.state.editor = await initializeMonacoEditor({
      container,
      isDarkTheme: this.state.isDarkTheme,
    });

    // Sync editor theme with website theme on initialization
    const editorTheme = this.state.isDarkTheme ? "vs-dark" : "vs";
    this.changeEditorTheme(editorTheme);

    // Listen for content changes
    this.state.editor.onDidChangeModelContent(() => {
      if (!this.isUpdatingFromTree) {
        // Clear view cache when JSON changes
        this.clearViewCache();
        this.validateAndUpdateTree();
      }
    });

    // Handle paste events
    this.state.editor.onDidPaste(() => {
      setTimeout(() => {
        this.formatJSON();
      }, 10);
    });
  }

  private async validateAndUpdateTree(): Promise<void> {
    await validateAndUpdateViews(
      this.state.editor,
      {
        treeOutput: this.elements.treeOutput,
        graphOutput: this.elements.graphOutput,
      },
      true,
      () => {
        this.isUpdatingFromTree = true;
      },
      () => {
        this.isUpdatingFromTree = false;
      }
    );
  }

  private bindEvents(): void {
    this.elements.formatBtn.addEventListener("click", () => this.formatJSON());
    this.elements.compactBtn.addEventListener("click", () => this.compactJSON());
    this.elements.clearBtn.addEventListener("click", () => this.clearAll());
    this.elements.copyBtn.addEventListener("click", () => this.copyJSON());
    this.elements.pasteBtn.addEventListener("click", () => this.pasteFromClipboard());
    this.elements.themeBtn.addEventListener("click", () => this.toggleTheme());
    this.elements.jsonExampleBtn.addEventListener("click", () => {
      // Simple modal opening - no module loading needed
      const modal = document.getElementById("jsonExampleModal");
      if (modal) {
        modal.style.display = "flex";
      }
    });

    // Listen for JSON example selection
    window.addEventListener("useJsonExample", (e: Event) => {
      const customEvent = e as CustomEvent;
      const exampleType = customEvent.detail.type;
      this.useJsonExample(exampleType);
    });

    if (this.elements.mobileThemeBtn) {
      this.elements.mobileThemeBtn.addEventListener("click", () => this.toggleTheme());
    }

    this.elements.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabName = target.getAttribute("data-tab");
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Tree control buttons
    this.elements.expandAllBtn?.addEventListener("click", async () => {
      const treeUtils = await loadTreeUtils();
      treeUtils.expandAll(this.elements.treeOutput);
    });

    this.elements.collapseAllBtn?.addEventListener("click", async () => {
      const treeUtils = await loadTreeUtils();
      treeUtils.collapseAll(this.elements.treeOutput);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          this.formatJSON();
        }
      }
    });
  }

  private async formatJSON(): Promise<void> {
    const result = formatJSONInEditor(this.state.editor);

    if (result.success && result.data) {
      await updateViews(
        result.data,
        {
          treeOutput: this.elements.treeOutput,
          graphOutput: this.elements.graphOutput,
        },
        this.state.currentTab,
        this.state.editor,
        false,
        () => {
          this.isUpdatingFromTree = true;
        },
        () => {
          this.isUpdatingFromTree = false;
        }
      );
    }
  }

  private async compactJSON(): Promise<void> {
    const result = compactJSONInEditor(this.state.editor);

    if (result.success && result.data) {
      await updateViews(
        result.data,
        {
          treeOutput: this.elements.treeOutput,
          graphOutput: this.elements.graphOutput,
        },
        this.state.currentTab,
        this.state.editor,
        false,
        () => {
          this.isUpdatingFromTree = true;
        },
        () => {
          this.isUpdatingFromTree = false;
        }
      );
    }
  }

  private clearAll(): void {
    clearEditor(this.state.editor);
    this.clearViewCache();
    clearViews({
      treeOutput: this.elements.treeOutput,
      graphOutput: this.elements.graphOutput,
      diffOutput: this.elements.diffOutput,
      statsOutput: this.elements.statsOutput,
      mapOutput: this.elements.mapOutput,
      chartOutput: this.elements.chartOutput,
      searchOutput: this.elements.searchOutput,
    });
  }

  private copyJSON(): void {
    copyEditorContent(this.state.editor);
  }

  private async pasteFromClipboard(): Promise<void> {
    const success = await pasteIntoEditor(this.state.editor, () => this.formatJSON());
    if (success) {
      // Switch to JSON Editor tab after successful paste
      this.switchTab("formatted");
    }
  }

  private switchTab(tabName: string): void {
    const previousTab = this.state.currentTab;
    this.state.currentTab = tabName;

    // Clear previous visualization to free memory for heavy views
    const heavyViews = ["graph", "map", "chart"];
    if (heavyViews.includes(previousTab) && previousTab !== tabName) {
      const prevOutput = this.elements[
        `${previousTab}Output` as keyof typeof this.elements
      ] as HTMLElement;
      if (prevOutput) {
        prevOutput.innerHTML = "";
        // Also remove from cache so it regenerates next time
        this.viewCache.generatedTabs.delete(previousTab);
      }
    }

    // Clean up diff editors when switching away from diff view
    if (previousTab === "diff" && tabName !== "diff") {
      loadDiffUtils().then((module) => {
        module.cleanupDiffEditors();
      });
      // Clear the diff output and remove from cache
      this.elements.diffOutput.innerHTML = "";
      this.viewCache.generatedTabs.delete("diff");
    }

    // Update tab buttons
    this.elements.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });

    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
      tabContent.classList.add("active");
    }

    // Generate view based on tab
    if (this.state.editor) {
      try {
        const content = this.state.editor.getValue();
        if (content.trim()) {
          const parsed = JSON.parse(content);
          const currentHash = this.hashJSON(content);

          // Check if JSON has changed
          if (currentHash !== this.viewCache.jsonHash) {
            // JSON changed, clear cache
            this.viewCache.jsonHash = currentHash;
            this.viewCache.generatedTabs.clear();
          }

          // Only generate view if not already cached for current JSON
          if (!this.viewCache.generatedTabs.has(tabName)) {
            this.viewCache.generatedTabs.add(tabName);

            switch (tabName) {
              case "graph":
                // Load D3 first, then graph utils
                loadD3Library()
                  .then(() => loadGraphUtils())
                  .then((module) => {
                    module.generateGraphView(parsed, this.elements.graphOutput);
                  })
                  .catch((error) => {
                    console.error("Failed to load graph dependencies:", error);
                    this.elements.graphOutput.innerHTML =
                      '<div class="error-message">Failed to load graph visualization. Please try again.</div>';
                  });
                break;
              case "diff":
                loadDiffUtils().then((module) => {
                  module.generateDiffView(parsed, this.elements.diffOutput);
                });
                break;
              case "stats":
                loadStatsUtils().then((module) => {
                  module.generateStatsView(parsed, this.elements.statsOutput);
                });
                break;
              case "map":
                loadMapUtils().then((module) => {
                  module.generateMapView(parsed, this.elements.mapOutput);
                });
                break;
              case "chart":
                loadChartUtils().then((module) => {
                  module.generateChartView(parsed, this.elements.chartOutput);
                });
                break;
              case "search":
                loadSearchUtils().then((module) => {
                  module.generateSearchView(parsed, this.elements.searchOutput);
                });
                break;
            }
          }
        }
      } catch (e) {
        // JSON is invalid, show error message
        const outputElement = this.elements[
          `${tabName}Output` as keyof typeof this.elements
        ] as HTMLElement;
        if (outputElement) {
          outputElement.innerHTML =
            '<div style="padding: 20px; color: var(--text-secondary);">Invalid JSON - Please fix errors in the editor</div>';
        }
      }
    }
  }

  private hashJSON(content: string): string {
    // Simple hash function for JSON content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private clearViewCache(): void {
    this.viewCache.jsonHash = "";
    this.viewCache.generatedTabs.clear();
  }

  private toggleTheme(): void {
    const themeState = toggleTheme({ isDarkTheme: this.state.isDarkTheme });
    this.state.isDarkTheme = themeState.isDarkTheme;

    // Automatically sync editor theme with website theme
    const editorTheme = this.state.isDarkTheme ? "vs-dark" : "vs";
    this.changeEditorTheme(editorTheme);

    updateThemeButtonText(this.elements.themeBtn, this.state.isDarkTheme);
  }

  private changeEditorTheme(themeName: string): void {
    // Save preference first
    localStorage.setItem("editorTheme", themeName);

    if (themeName === "default") {
      // Use theme based on light/dark mode
      setMonacoTheme(this.state.editor, undefined, this.state.isDarkTheme);
    } else {
      // Use specific theme
      setMonacoTheme(this.state.editor, themeName);
    }
  }

  private async useJsonExample(exampleType: string): Promise<void> {
    const jsonExampleUtils = await loadJsonExampleUtils();
    const jsonContent = jsonExampleUtils.getJsonExampleContent(exampleType);
    if (jsonContent && this.state.editor) {
      this.state.editor.setValue(jsonContent);
      // Switch to JSON Editor tab
      this.switchTab("formatted");
    }
  }
}

// Initialize when DOM and all resources are ready
function initializeApp() {
  new JSONViewer();
}

// Use window load to ensure all scripts are loaded
window.addEventListener("load", () => {
  // Give a small delay to ensure all libraries are initialized
  setTimeout(initializeApp, 100);
});
