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
        toastr.success("Content pasted from clipboard!");
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
