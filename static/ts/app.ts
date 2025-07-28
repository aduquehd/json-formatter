"use strict";

import { generateTreeView } from "./utils/tree-utils.js";

declare var toastr: any;
declare var require: any;

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
    };

    this.initializeTheme();
    this.initializeMonacoEditor();
    this.bindEvents();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem("theme");
    this.state.isDarkTheme = savedTheme === "dark";
    document.documentElement.setAttribute("data-theme", this.state.isDarkTheme ? "dark" : "light");
  }

  private initializeMonacoEditor(): void {
    require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" } });

    require(["vs/editor/editor.main"], () => {
      const container = document.getElementById("monaco-editor")!;
      
      // Define custom themes
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
      generateTreeView(parsed, this.elements.treeOutput);
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
      generateTreeView(parsed, this.elements.treeOutput);
      
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
      generateTreeView(parsed, this.elements.treeOutput);
      
      toastr.success("JSON compacted successfully!");
    } catch (e: any) {
      toastr.error(`Invalid JSON: ${e.message}`);
    }
  }

  private clearAll(): void {
    if (!this.state.editor) return;
    
    this.state.editor.setValue("");
    this.elements.treeOutput.innerHTML = "";
    toastr.success("Editor cleared!");
  }

  private copyJSON(): void {
    if (!this.state.editor) return;

    const content = this.state.editor.getValue();
    navigator.clipboard.writeText(content).then(() => {
      toastr.success("JSON copied to clipboard!");
    }).catch(() => {
      toastr.error("Failed to copy to clipboard!");
    });
  }

  private pasteFromClipboard(): void {
    navigator.clipboard.readText().then((text) => {
      if (text && this.state.editor) {
        this.state.editor.setValue(text);
        setTimeout(() => {
          this.formatJSON();
        }, 10);
      }
    }).catch(() => {
      toastr.error("Failed to paste from clipboard!");
    });
  }

  private switchTab(tabName: string): void {
    this.state.currentTab = tabName;
    
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
  }

  private toggleTheme(): void {
    this.state.isDarkTheme = !this.state.isDarkTheme;
    document.documentElement.setAttribute("data-theme", this.state.isDarkTheme ? "dark" : "light");
    
    if (this.state.editor) {
      monaco.editor.setTheme(this.state.isDarkTheme ? "custom-dark" : "custom-light");
    }

    localStorage.setItem("theme", this.state.isDarkTheme ? "dark" : "light");
    toastr.success(`Switched to ${this.state.isDarkTheme ? "dark" : "light"} theme`);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new JSONViewer();
});