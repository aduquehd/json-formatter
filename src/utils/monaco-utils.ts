declare var require: any;
declare var monaco: any;

export interface MonacoEditorConfig {
  container: HTMLElement;
  isDarkTheme: boolean;
}

export function initializeMonacoEditor(config: MonacoEditorConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if Monaco is already loaded
    if ((window as any).monaco) {
      const editor = createEditor(config);
      resolve(editor);
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
      defineCustomThemes();
      const editor = createEditor(config);
      setupJSONValidation();
      resolve(editor);
    });
  });
}

function createEditor(config: MonacoEditorConfig): any {
  return monaco.editor.create(config.container, {
    value: "",
    language: "json",
    theme: config.isDarkTheme ? "custom-dark" : "custom-light",
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
}

function defineCustomThemes(): void {
  // Define custom themes only once
  if ((window as any).monacoThemesDefined) {
    return;
  }

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

function setupJSONValidation(): void {
  // Configure JSON language features
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [],
    allowComments: false,
    trailingCommas: false,
  });
}

export function setMonacoTheme(editor: any, isDarkTheme: boolean): void {
  if (editor) {
    monaco.editor.setTheme(isDarkTheme ? "custom-dark" : "custom-light");
  }
}