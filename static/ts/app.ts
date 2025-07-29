"use strict";

import { generateTreeView } from "./utils/tree-utils.js";
import { generateGraphView } from "./utils/graph-utils.js";

declare var toastr: any;
declare var require: any;
declare var d3: any;

interface AppState {
  editor: any | null;
  currentTab: string;
  isDarkTheme: boolean;
}

class JSONViewer {
  private state: AppState;
  private elements: {
    formatBtn: HTMLElement;
    compactBtn: HTMLElement;
    clearBtn: HTMLElement;
    copyBtn: HTMLElement;
    pasteBtn: HTMLElement;
    themeBtn: HTMLElement;
    tabBtns: NodeListOf<HTMLElement>;
    treeOutput: HTMLElement;
    graphOutput: HTMLElement;
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
      tabBtns: document.querySelectorAll(".tab-btn"),
      treeOutput: document.getElementById("treeOutput")!,
      graphOutput: document.getElementById("graphOutput")!,
    };

    this.initializeTheme();
    this.bindEvents();

    // Delay Monaco initialization to avoid conflicts
    setTimeout(() => {
      this.initializeMonacoEditor();
    }, 50);
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem("theme");
    this.state.isDarkTheme = savedTheme === "dark";
    document.documentElement.setAttribute("data-theme", this.state.isDarkTheme ? "dark" : "light");

    // Update theme button text
    const themeText = this.elements.themeBtn.querySelector(".theme-text");
    if (themeText) {
      themeText.textContent = this.state.isDarkTheme ? "Light" : "Dark";
    }
  }

  private initializeMonacoEditor(): void {
    // Check if Monaco is already loaded
    if ((window as any).monaco && this.state.editor) {
      return;
    }

    // Only configure require once
    if (!(window as any).monacoRequireConfigured) {
      require.config({
        paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" },
      });
      (window as any).monacoRequireConfigured = true;
    }

    require(["vs/editor/editor.main"], () => {
      // Double-check editor doesn't already exist
      if (this.state.editor) {
        return;
      }
      const container = document.getElementById("monaco-editor")!;

      // Define custom themes only once
      if (!(window as any).monacoThemesDefined) {
        monaco.editor.defineTheme("custom-light", {
          base: "vs",
          inherit: true,
          rules: [
            { token: "string.key.json", foreground: "d73a49" },
            { token: "string.value.json", foreground: "22863a" },
            { token: "number", foreground: "005cc5" },
            { token: "keyword.json", foreground: "d73a49" },
            { token: "delimiter.bracket.json", foreground: "24292e" },
          ],
          colors: {
            "editor.background": "#ffffff",
            "editor.foreground": "#24292e",
            "editor.lineHighlightBackground": "#f6f8fa",
            "editorLineNumber.foreground": "#656d76",
            "editorLineNumber.activeForeground": "#24292e",
            "editor.selectionBackground": "#0366d625",
            "editor.inactiveSelectionBackground": "#0366d615",
          },
        });

        monaco.editor.defineTheme("custom-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "string.key.json", foreground: "f97583" },
            { token: "string.value.json", foreground: "79b8ff" },
            { token: "number", foreground: "ffab70" },
            { token: "keyword.json", foreground: "f97583" },
            { token: "delimiter.bracket.json", foreground: "e1e4e8" },
          ],
          colors: {
            "editor.background": "#1a1a1a",
            "editor.foreground": "#e1e4e8",
            "editor.lineHighlightBackground": "#2d2d2d",
            "editorLineNumber.foreground": "#7d8590",
            "editorLineNumber.activeForeground": "#e1e4e8",
            "editor.selectionBackground": "#3392ff44",
            "editor.inactiveSelectionBackground": "#3392ff22",
          },
        });
        (window as any).monacoThemesDefined = true;
      }

      this.state.editor = monaco.editor.create(container, {
        value: "",
        language: "json",
        theme: this.state.isDarkTheme ? "custom-dark" : "custom-light",
        automaticLayout: true,
        fontSize: 14,
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
        minimap: {
          enabled: true,
          renderCharacters: false,
        },
        folding: true,
        lineNumbers: "on",
        lineNumbersMinChars: 4,
        lineDecorationsWidth: 0,
        renderLineHighlight: "all",
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
          top: 16,
          bottom: 16,
        },
      });

      // Add custom JSON validation
      this.setupJSONValidation();

      // Listen for content changes
      this.state.editor.onDidChangeModelContent(() => {
        this.validateAndUpdateTree();
      });

      // Handle paste events
      this.state.editor.onDidPaste(() => {
        setTimeout(() => {
          this.formatJSON();
        }, 10);
      });
    });
  }

  private setupJSONValidation(): void {
    if (!this.state.editor) return;

    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [],
      allowComments: false,
      trailingCommas: false,
    });
  }

  private validateAndUpdateTree(): void {
    if (!this.state.editor) return;

    try {
      const content = this.state.editor.getValue();
      if (!content.trim()) {
        this.elements.treeOutput.innerHTML = "";
        return;
      }

      const parsed = JSON.parse(content);

      // Only update the tree view always (it's lightweight)
      generateTreeView(parsed, this.elements.treeOutput);

      // Graph view will be generated only when its tab is clicked
    } catch (e) {
      // JSON is invalid, don't update tree
    }
  }

  private bindEvents(): void {
    this.elements.formatBtn.addEventListener("click", () => this.formatJSON());
    this.elements.compactBtn.addEventListener("click", () => this.compactJSON());
    this.elements.clearBtn.addEventListener("click", () => this.clearAll());
    this.elements.copyBtn.addEventListener("click", () => this.copyJSON());
    this.elements.pasteBtn.addEventListener("click", () => this.pasteFromClipboard());
    this.elements.themeBtn.addEventListener("click", () => this.toggleTheme());

    this.elements.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute("data-tab");
        if (tabName) {
          this.switchTab(tabName);
        }
      });
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
    if (!this.state.editor) return;

    try {
      const content = this.state.editor.getValue();
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);

      this.state.editor.setValue(formatted);

      // Always update tree view (it's lightweight)
      generateTreeView(parsed, this.elements.treeOutput);

      // Only regenerate current view if it's graph
      if (this.state.currentTab === "graph") {
        generateGraphView(parsed, this.elements.graphOutput);
      }

      toastr.success("JSON formatted successfully!");
    } catch (e: any) {
      toastr.error(`Invalid JSON: ${e.message}`);
    }
  }

  private compactJSON(): void {
    if (!this.state.editor) return;

    try {
      const content = this.state.editor.getValue();
      const parsed = JSON.parse(content);
      const compacted = JSON.stringify(parsed);

      this.state.editor.setValue(compacted);

      // Always update tree view (it's lightweight)
      generateTreeView(parsed, this.elements.treeOutput);

      // Only regenerate current view if it's graph
      if (this.state.currentTab === "graph") {
        generateGraphView(parsed, this.elements.graphOutput);
      }

      toastr.success("JSON compacted successfully!");
    } catch (e: any) {
      toastr.error(`Invalid JSON: ${e.message}`);
    }
  }

  private clearAll(): void {
    if (!this.state.editor) return;

    this.state.editor.setValue("");
    this.elements.treeOutput.innerHTML = "";
    this.elements.graphOutput.innerHTML = "";
    toastr.success("Editor cleared!");
  }

  private copyJSON(): void {
    if (!this.state.editor) return;

    const content = this.state.editor.getValue();
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toastr.success("JSON copied to clipboard!");
      })
      .catch(() => {
        toastr.error("Failed to copy to clipboard!");
      });
  }

  private pasteFromClipboard(): void {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text && this.state.editor) {
          this.state.editor.setValue(text);
          setTimeout(() => {
            this.formatJSON();
          }, 10);
        }
      })
      .catch(() => {
        toastr.error("Failed to paste from clipboard!");
      });
  }

  private switchTab(tabName: string): void {
    const previousTab = this.state.currentTab;
    this.state.currentTab = tabName;

    // Clear previous visualization to free memory
    if (previousTab === "graph" && tabName !== "graph") {
      this.elements.graphOutput.innerHTML = "";
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

    // Generate view only when switching TO graph tab
    if (this.state.editor) {
      try {
        const content = this.state.editor.getValue();
        if (content.trim()) {
          const parsed = JSON.parse(content);

          if (tabName === "graph") {
            // Generate graph view lazily
            generateGraphView(parsed, this.elements.graphOutput);
          }
        }
      } catch (e) {
        // JSON is invalid, show error message
        if (tabName === "graph") {
          this.elements.graphOutput.innerHTML =
            '<div style="padding: 20px; color: var(--text-secondary);">Invalid JSON - Please fix errors in the editor</div>';
        }
      }
    }
  }

  private toggleTheme(): void {
    this.state.isDarkTheme = !this.state.isDarkTheme;
    document.documentElement.setAttribute("data-theme", this.state.isDarkTheme ? "dark" : "light");

    if (this.state.editor) {
      monaco.editor.setTheme(this.state.isDarkTheme ? "custom-dark" : "custom-light");
    }

    // Update theme button text
    const themeText = this.elements.themeBtn.querySelector(".theme-text");
    if (themeText) {
      themeText.textContent = this.state.isDarkTheme ? "Light" : "Dark";
    }

    localStorage.setItem("theme", this.state.isDarkTheme ? "dark" : "light");
    toastr.success(`Switched to ${this.state.isDarkTheme ? "dark" : "light"} theme`);
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

  console.log("D3.js loaded successfully");
  new JSONViewer();
}

// Use window load to ensure all scripts are loaded
window.addEventListener("load", () => {
  // Give a small delay to ensure all libraries are initialized
  setTimeout(initializeApp, 100);
});
