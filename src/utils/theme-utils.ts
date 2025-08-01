export interface ThemeState {
  isDarkTheme: boolean;
}

export function initializeTheme(): ThemeState {
  const savedTheme = localStorage.getItem("theme");
  const isDarkTheme = savedTheme === "dark";
  document.documentElement.setAttribute("data-theme", isDarkTheme ? "dark" : "light");

  return { isDarkTheme };
}

export function toggleTheme(currentState: ThemeState): ThemeState {
  const isDarkTheme = !currentState.isDarkTheme;
  document.documentElement.setAttribute("data-theme", isDarkTheme ? "dark" : "light");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");

  return { isDarkTheme };
}

export function updateThemeButtonText(button: HTMLElement, isDarkTheme: boolean): void {
  const themeText = button.querySelector(".theme-text");
  if (themeText) {
    themeText.textContent = isDarkTheme ? "Light" : "Dark";
  }
}

export function getMonacoTheme(isDarkTheme: boolean): string {
  return isDarkTheme ? "custom-dark" : "custom-light";
}
