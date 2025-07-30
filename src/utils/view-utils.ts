import { generateTreeView } from "./tree-utils.js";
import { generateGraphView } from "./graph-utils.js";
import { JSONValue } from "./types.js";

export interface ViewElements {
  treeOutput: HTMLElement;
  graphOutput: HTMLElement;
}

export function updateViews(
  data: JSONValue, 
  elements: ViewElements, 
  currentTab: string,
  editor?: any,
  preserveTreeState: boolean = false,
  onBeforeEditorUpdate?: () => void,
  onAfterEditorUpdate?: () => void
): void {
  // Always update tree view (it's lightweight)
  generateTreeView(data, elements.treeOutput, editor ? (newData) => {
    // Update the editor when tree view changes
    if (onBeforeEditorUpdate) onBeforeEditorUpdate();
    const formatted = JSON.stringify(newData, null, 2);
    editor.setValue(formatted);
    if (onAfterEditorUpdate) onAfterEditorUpdate();
  } : undefined, preserveTreeState);

  // Only regenerate graph view if it's the current tab
  if (currentTab === "graph") {
    generateGraphView(data, elements.graphOutput);
  }
}

export function clearViews(elements: ViewElements): void {
  elements.treeOutput.innerHTML = "";
  elements.graphOutput.innerHTML = "";
}

export function validateAndUpdateViews(
  editor: any, 
  elements: ViewElements,
  preserveTreeState: boolean = true,
  onBeforeEditorUpdate?: () => void,
  onAfterEditorUpdate?: () => void
): void {
  if (!editor) return;

  try {
    const content = editor.getValue();
    if (!content.trim()) {
      elements.treeOutput.innerHTML = "";
      return;
    }

    const parsed = JSON.parse(content);
    generateTreeView(parsed, elements.treeOutput, (newData) => {
      // Update the editor when tree view changes
      if (onBeforeEditorUpdate) onBeforeEditorUpdate();
      const formatted = JSON.stringify(newData, null, 2);
      editor.setValue(formatted);
      if (onAfterEditorUpdate) onAfterEditorUpdate();
    }, preserveTreeState);
  } catch (e) {
    // JSON is invalid, don't update views
  }
}