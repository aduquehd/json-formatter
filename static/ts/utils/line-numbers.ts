export function updateLineNumbers(editor: HTMLElement, lineNumbersContainer: HTMLElement): void {
  // Get the text content from the editor
  const content = editor.innerText || editor.textContent || '';
  
  // Count the lines
  const lines = content.split('\n');
  const lineCount = Math.max(1, lines.length);
  
  // Generate line numbers
  const lineNumbersHTML = Array.from({ length: lineCount }, (_, i) => 
    `<div class="line-number">${i + 1}</div>`
  ).join('');
  
  lineNumbersContainer.innerHTML = lineNumbersHTML;
}

export function syncLineNumbersScroll(editor: HTMLElement, lineNumbersContainer: HTMLElement): void {
  // Sync the scroll position between editor and line numbers
  lineNumbersContainer.scrollTop = editor.scrollTop;
}

export function setupLineNumbersSync(editor: HTMLElement, lineNumbersContainer: HTMLElement): void {
  // Set up scroll synchronization
  editor.addEventListener('scroll', () => {
    syncLineNumbersScroll(editor, lineNumbersContainer);
  });
  
  // Set up content change observation for line number updates
  const observer = new MutationObserver(() => {
    updateLineNumbers(editor, lineNumbersContainer);
  });
  
  observer.observe(editor, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  // Also listen to input events for real-time updates
  editor.addEventListener('input', () => {
    setTimeout(() => {
      updateLineNumbers(editor, lineNumbersContainer);
    }, 0);
  });
  
  // Initial line numbers
  updateLineNumbers(editor, lineNumbersContainer);
}