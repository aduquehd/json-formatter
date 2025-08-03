export function highlightJSON(jsonString: string): string {
  // Escape HTML entities first
  const escaped = jsonString.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return (
    escaped
      // Strings (including keys)
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="json-string">"$1"</span>')
      // Numbers
      .replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>')
      // Booleans
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      // Null
      .replace(/\bnull\b/g, '<span class="json-null">null</span>')
      // Brackets and braces
      .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>')
      // Colons
      .replace(/:/g, '<span class="json-colon">:</span>')
      // Commas
      .replace(/,/g, '<span class="json-comma">,</span>')
  );
}

export function removeHighlighting(element: HTMLElement): string {
  // Get plain text content, removing all HTML tags
  return element.innerText || element.textContent || "";
}

export function applyHighlighting(element: HTMLElement, jsonString: string): void {
  const highlighted = highlightJSON(jsonString);
  element.innerHTML = highlighted;
}

export function getCaretPosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange.toString().length;
}

export function setCaretPosition(element: HTMLElement, position: number): void {
  const selection = window.getSelection();
  if (!selection) return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let currentPos = 0;
  let node;

  while ((node = walker.nextNode())) {
    const textLength = node.textContent?.length || 0;
    if (currentPos + textLength >= position) {
      const range = document.createRange();
      range.setStart(node, position - currentPos);
      range.setEnd(node, position - currentPos);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentPos += textLength;
  }

  // If we can't find the exact position, place cursor at the end
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function preserveCursorAndHighlight(element: HTMLElement, jsonString: string): void {
  const cursorPosition = getCaretPosition(element);
  applyHighlighting(element, jsonString);
  setCaretPosition(element, cursorPosition);
}
