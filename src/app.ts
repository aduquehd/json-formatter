"use strict";

import { generateTreeView, expandAll, collapseAll } from "./utils/tree-utils.js";
import { generateGraphView } from "./utils/graph-utils.js";
import { generateDiffView } from "./utils/diff-utils.js";
import { generateStatsView } from "./utils/stats-utils.js";
import { generateMapView } from "./utils/map-utils.js";
import { generateChartView } from "./utils/chart-utils.js";
import { generateSearchView } from "./utils/search-utils.js";
import { initializeTheme, toggleTheme, updateThemeButtonText } from "./utils/theme-utils.js";
import { initializeMonacoEditor, setMonacoTheme } from "./utils/monaco-utils.js";
import { formatJSONInEditor, compactJSONInEditor, clearEditor } from "./utils/json-utils.js";
import { copyEditorContent, pasteIntoEditor } from "./utils/clipboard-utils.js";
import { updateViews, clearViews, validateAndUpdateViews } from "./utils/view-utils.js";

declare var toastr: any;
declare var d3: any;

interface AppState {
  editor: any | null;
  currentTab: string;
  isDarkTheme: boolean;
}

class JSONViewer {
  private state: AppState;
  private isUpdatingFromTree: boolean = false;
  private elements: {
    formatBtn: HTMLElement;
    compactBtn: HTMLElement;
    clearBtn: HTMLElement;
    copyBtn: HTMLElement;
    pasteBtn: HTMLElement;
    themeBtn: HTMLElement;
    mobileThemeBtn: HTMLElement | null;
    editorThemeSelect: HTMLSelectElement;
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
      editorThemeSelect: document.getElementById("editorThemeSelect") as HTMLSelectElement,
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

    // Delay Monaco initialization to avoid conflicts
    setTimeout(() => {
      this.initializeMonacoEditor();
    }, 50);
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
    this.state.editor = await initializeMonacoEditor({
      container,
      isDarkTheme: this.state.isDarkTheme,
    });

    // Apply saved theme preference
    const savedTheme = localStorage.getItem("editorTheme") || "default";
    this.elements.editorThemeSelect.value = savedTheme;
    this.changeEditorTheme(savedTheme);

    // Listen for content changes
    this.state.editor.onDidChangeModelContent(() => {
      if (!this.isUpdatingFromTree) {
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

  private validateAndUpdateTree(): void {
    validateAndUpdateViews(
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

    if (this.elements.mobileThemeBtn) {
      this.elements.mobileThemeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Editor theme selector
    this.elements.editorThemeSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      this.changeEditorTheme(target.value);
    });

    this.elements.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute("data-tab");
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Tree control buttons
    this.elements.expandAllBtn?.addEventListener("click", () => {
      expandAll(this.elements.treeOutput);
    });

    this.elements.collapseAllBtn?.addEventListener("click", () => {
      collapseAll(this.elements.treeOutput);
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

  private formatJSON(): void {
    const result = formatJSONInEditor(this.state.editor);

    if (result.success && result.data) {
      updateViews(
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

  private compactJSON(): void {
    const result = compactJSONInEditor(this.state.editor);

    if (result.success && result.data) {
      updateViews(
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

  private pasteFromClipboard(): void {
    pasteIntoEditor(this.state.editor, () => this.formatJSON());
  }

  private switchTab(tabName: string): void {
    const previousTab = this.state.currentTab;
    this.state.currentTab = tabName;

    // Clear previous visualization to free memory for heavy views
    const heavyViews = ["graph", "map", "chart"];
    if (heavyViews.includes(previousTab) && previousTab !== tabName) {
      const prevOutput = this.elements[`${previousTab}Output` as keyof typeof this.elements] as HTMLElement;
      if (prevOutput) prevOutput.innerHTML = "";
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

          switch (tabName) {
            case "graph":
              generateGraphView(parsed, this.elements.graphOutput);
              break;
            case "diff":
              generateDiffView(parsed, this.elements.diffOutput);
              break;
            case "stats":
              generateStatsView(parsed, this.elements.statsOutput);
              break;
            case "map":
              generateMapView(parsed, this.elements.mapOutput);
              break;
            case "chart":
              generateChartView(parsed, this.elements.chartOutput);
              break;
            case "search":
              generateSearchView(parsed, this.elements.searchOutput);
              break;
          }
        }
      } catch (e) {
        // JSON is invalid, show error message
        const outputElement = this.elements[`${tabName}Output` as keyof typeof this.elements] as HTMLElement;
        if (outputElement) {
          outputElement.innerHTML =
            '<div style="padding: 20px; color: var(--text-secondary);">Invalid JSON - Please fix errors in the editor</div>';
        }
      }
    }
  }

  private toggleTheme(): void {
    const themeState = toggleTheme({ isDarkTheme: this.state.isDarkTheme });
    this.state.isDarkTheme = themeState.isDarkTheme;

    // Update editor theme based on current selection
    this.updateEditorThemeBasedOnMode();
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

  private updateEditorThemeBasedOnMode(): void {
    const savedTheme = localStorage.getItem("editorTheme") || "default";
    if (savedTheme === "default") {
      // Apply the appropriate custom theme based on current mode
      setMonacoTheme(this.state.editor, undefined, this.state.isDarkTheme);
    } else {
      // Keep the specific theme that was selected
      setMonacoTheme(this.state.editor, savedTheme);
    }
  }
}

// Initialize when DOM and all resources are ready
let d3LoadRetries = 0;
const MAX_D3_RETRIES = 30; // 3 seconds max wait time

function initializeApp() {
  if (typeof d3 === "undefined") {
    d3LoadRetries++;
    if (d3LoadRetries >= MAX_D3_RETRIES) {
      console.error(
        "D3.js failed to load after maximum retries. Graph View will not be available."
      );
      // Initialize app anyway, Graph View will show error when accessed
      new JSONViewer();
      return;
    }
    console.warn(`D3.js is not available. Retry ${d3LoadRetries}/${MAX_D3_RETRIES}...`);
    setTimeout(initializeApp, 100);
    return;
  }

  new JSONViewer();
}

// Use window load to ensure all scripts are loaded
window.addEventListener("load", () => {
  // Give a small delay to ensure all libraries are initialized
  setTimeout(initializeApp, 100);
});
