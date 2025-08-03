declare var toastr: any;

export function copyToClipboard(content: string): void {
  if (!content) {
    toastr.warning("No content to copy!");
    return;
  }

  navigator.clipboard
    .writeText(content)
    .then(() => {
      toastr.success("JSON copied to clipboard!");
    })
    .catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand("copy");
        toastr.success("JSON copied to clipboard!");
      } catch {
        toastr.error("Failed to copy JSON. Please try selecting and copying manually.");
      }

      document.body.removeChild(textArea);
    });
}

export function pasteFromClipboard(): Promise<string | null> {
  return navigator.clipboard
    .readText()
    .then((text) => {
      if (text) {
        return text;
      } else {
        toastr.warning("Clipboard is empty!");
        return null;
      }
    })
    .catch(() => {
      // Fallback message for browsers that don't support clipboard API
      toastr.error("Unable to access clipboard. Please paste manually using Ctrl+V or Cmd+V.");
      return null;
    });
}

export function copyEditorContent(editor: any): void {
  if (!editor) {
    toastr.error("Editor not initialized!");
    return;
  }

  const content = editor.getValue();
  copyToClipboard(content);
  
  // Add pulse animation to copy button
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.classList.add('copied');
    setTimeout(() => copyBtn.classList.remove('copied'), 400);
  }
}

export async function pasteIntoEditor(editor: any, formatCallback?: () => void): Promise<boolean> {
  if (!editor) {
    toastr.error("Editor not initialized!");
    return false;
  }

  const text = await pasteFromClipboard();
  if (text) {
    editor.setValue(text);
    
    // Add pulse animation to paste button
    const pasteBtn = document.getElementById('pasteBtn');
    if (pasteBtn) {
      pasteBtn.classList.add('pasted');
      setTimeout(() => pasteBtn.classList.remove('pasted'), 400);
    }
    
    if (formatCallback) {
      setTimeout(formatCallback, 10);
    }
    return true;
  }
  return false;
}

export function handlePasteEvent(e: ClipboardEvent): string | null {
  e.preventDefault();

  const clipboardData = e.clipboardData || (window as any).clipboardData;

  if (clipboardData.files && clipboardData.files.length > 0) {
    toastr.error("Only text content is allowed. Images and files cannot be pasted.");
    return null;
  }

  const pastedText = clipboardData.getData("text/plain") || clipboardData.getData("text");

  if (!pastedText) {
    toastr.error("No text content found in clipboard.");
    return null;
  }

  return pastedText;
}
