declare namespace monaco {
  namespace editor {
    function create(domElement: HTMLElement, options?: any): any;
    function defineTheme(themeName: string, themeData: any): void;
    function setTheme(themeName: string): void;
  }

  namespace languages {
    namespace json {
      namespace jsonDefaults {
        function setDiagnosticsOptions(options: any): void;
      }
    }
  }
}
