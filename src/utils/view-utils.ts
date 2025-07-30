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
  editor?: any
): void {
  // Always update tree view (it's lightweight)
  generateTreeView(data, elements.treeOutput, editor ? (newData) => {
    // Update the editor when tree view changes
    const formatted = JSON.stringify(newData, null, 2);
    editor.setValue(formatted);
  } : undefined);

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
  elements: ViewElements
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
      const formatted = JSON.stringify(newData, null, 2);
      editor.setValue(formatted);
    });
  } catch (e) {
    // JSON is invalid, don't update views
  }
}