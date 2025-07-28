import { DOMElements } from './types.js';

export function initializeElements(): DOMElements | null {
  const formattedOutput = document.getElementById("formattedOutput");
  const treeOutput = document.getElementById("treeOutput");
  const formatBtn = document.getElementById("formatBtn") as HTMLButtonElement;
  const compactBtn = document.getElementById("compactBtn") as HTMLButtonElement;
  const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
  const copyBtn = document.getElementById("copyBtn") as HTMLButtonElement;
  const pasteBtn = document.getElementById("pasteBtn") as HTMLButtonElement;
  const tabBtns = document.querySelectorAll(".tab-btn") as NodeListOf<HTMLButtonElement>;
  const tabContents = document.querySelectorAll(".tab-content") as NodeListOf<HTMLElement>;
  const pasteHint = document.getElementById("pasteHint");
  const editHint = document.getElementById("editHint");
  const minimapContainer = document.getElementById("minimapContainer");
  const minimapContent = document.getElementById("minimapContent");
  const minimapViewport = document.getElementById("minimapViewport");

  if (!formattedOutput || !treeOutput || !formatBtn || !compactBtn || !clearBtn || !copyBtn || !pasteBtn || !pasteHint || !editHint || !minimapContainer || !minimapContent || !minimapViewport) {
    console.error('Required DOM elements not found');
    return null;
  }

  return {
    formattedOutput,
    treeOutput,
    formatBtn,
    compactBtn,
    clearBtn,
    copyBtn,
    pasteBtn,
    tabBtns,
    tabContents,
    pasteHint,
    editHint,
    minimapContainer,
    minimapContent,
    minimapViewport
  };
}

export function switchTab(tabName: string, elements: DOMElements): void {
  elements.tabBtns.forEach((btn) => btn.classList.remove("active"));
  elements.tabContents.forEach((content) => content.classList.remove("active"));
  
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`${tabName}-tab`);
  
  if (activeBtn && activeContent) {
    activeBtn.classList.add("active");
    activeContent.classList.add("active");
  }
}

export function showPasteMode(elements: DOMElements): void {
  elements.pasteHint.style.display = "flex";
  elements.editHint.style.display = "none";
  elements.formattedOutput.classList.add("paste-mode");
  elements.formattedOutput.classList.remove("formatted-mode");
}

export function showFormattedMode(elements: DOMElements): void {
  elements.pasteHint.style.display = "none";
  elements.editHint.style.display = "flex";
  elements.formattedOutput.classList.remove("paste-mode");
  elements.formattedOutput.classList.add("formatted-mode");
}

export function clearOutput(elements: DOMElements): void {
  elements.formattedOutput.textContent = "";
  elements.treeOutput.innerHTML = "";
}