declare global {
  interface Window {
    i18n?: {
      t: (key: string) => string | undefined;
      language: string;
      changeLanguage: (lng: string) => Promise<void>;
    };
  }
}

export {};