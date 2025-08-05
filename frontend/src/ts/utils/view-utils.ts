import { JSONValue } from "./types.js";
import { loadTreeUtils, loadGraphUtils } from "./lazy-loader.js";
import { JSONFixer } from "../jsonFixer.js";
import { showWarning } from "./notification-utils.js";
import { NotificationManager } from "./notification-manager.js";

export interface ViewElements {
  treeOutput: HTMLElement;
  graphOutput: HTMLElement;
  diffOutput?: HTMLElement;
  statsOutput?: HTMLElement;
  mapOutput?: HTMLElement;
  chartOutput?: HTMLElement;
  searchOutput?: HTMLElement;
}

export async function updateViews(
  data: JSONValue,
  elements: ViewElements,
  currentTab: string,
  editor?: any,
  preserveTreeState: boolean = false,
  onBeforeEditorUpdate?: () => void,
  onAfterEditorUpdate?: () => void
): Promise<void> {
  // Always update tree view (it's lightweight and commonly used)
  const treeUtils = await loadTreeUtils();
  treeUtils.generateTreeView(
    data,
    elements.treeOutput,
    editor
      ? (newData: JSONValue) => {
          // Update the editor when tree view changes
          if (onBeforeEditorUpdate) onBeforeEditorUpdate();
          const formatted = JSON.stringify(newData, null, 2);
          editor.setValue(formatted);
          if (onAfterEditorUpdate) onAfterEditorUpdate();
        }
      : undefined,
    preserveTreeState
  );

  // Only regenerate graph view if it's the current tab
  if (currentTab === "graph") {
    const graphUtils = await loadGraphUtils();
    graphUtils.generateGraphView(data, elements.graphOutput);
  }
}

export function clearViews(elements: ViewElements): void {
  elements.treeOutput.innerHTML = "";
  elements.graphOutput.innerHTML = "";
  if (elements.diffOutput) elements.diffOutput.innerHTML = "";
  if (elements.statsOutput) elements.statsOutput.innerHTML = "";
  if (elements.mapOutput) elements.mapOutput.innerHTML = "";
  if (elements.chartOutput) elements.chartOutput.innerHTML = "";
  if (elements.searchOutput) elements.searchOutput.innerHTML = "";
}

export async function validateAndUpdateViews(
  editor: any,
  elements: ViewElements,
  preserveTreeState: boolean = true,
  onBeforeEditorUpdate?: () => void,
  onAfterEditorUpdate?: () => void
): Promise<void> {
  if (!editor) return;

  try {
    const content = editor.getValue();
    if (!content.trim()) {
      elements.treeOutput.innerHTML = "";
      return;
    }

    const result = JSONFixer.parseWithFixInfo(content);
    if (result.wasFixed && result.fixes && NotificationManager.shouldShowFixNotification(result.fixes)) {
      const description = NotificationManager.getFixDescription(result.fixes);
      showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${description}`);
    }
    const parsed = result.data;
    const treeUtils = await loadTreeUtils();
    treeUtils.generateTreeView(
      parsed,
      elements.treeOutput,
      (newData: JSONValue) => {
        // Update the editor when tree view changes
        if (onBeforeEditorUpdate) onBeforeEditorUpdate();
        const formatted = JSON.stringify(newData, null, 2);
        editor.setValue(formatted);
        if (onAfterEditorUpdate) onAfterEditorUpdate();
      },
      preserveTreeState
    );
  } catch (e) {
    // JSON is invalid, don't update views
  }
}
