// Minimal modal loader - handles JSON example modal without loading heavy dependencies

// Simple modal close function
function closeJsonExampleModal(): void {
  const modal = document.getElementById("jsonExampleModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Handle JSON example selection with lazy loading
async function handleExampleSelection(exampleType: string): Promise<void> {
  try {
    // Find the card and show loading state
    const card = document.querySelector(`[data-example="${exampleType}"]`);
    const button = card?.querySelector(".json-example-use-btn") as HTMLButtonElement;
    let originalText = "";
    
    if (button) {
      originalText = button.textContent || "";
      button.textContent = "Loading...";
      button.disabled = true;
    }

    // Dynamically import the json-example-utils module
    const module = await import("./utils/json-example-utils.js");
    
    // Get the JSON content
    const jsonContent = module.getJsonExampleContent(exampleType);
    
    if (jsonContent) {
      // Dispatch event for the app to handle
      const event = new CustomEvent("useJsonExample", {
        detail: { type: exampleType }
      });
      window.dispatchEvent(event);
      
      // Close the modal
      closeJsonExampleModal();
    } else {
      console.error("Failed to get JSON example content");
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  } catch (error) {
    console.error("Error loading JSON example:", error);
    // Restore button state on error
    const card = document.querySelector(`[data-example="${exampleType}"]`);
    const button = card?.querySelector(".json-example-use-btn") as HTMLButtonElement;
    if (button) {
      button.textContent = "Use this example";
      button.disabled = false;
    }
  }
}

// Initialize modal event handlers
function initializeModalHandlers(): void {
  // Modal close button
  const modalClose = document.querySelector(".json-example-modal-close");
  if (modalClose) {
    modalClose.addEventListener("click", closeJsonExampleModal);
  }

  // Click outside modal to close
  const modal = document.getElementById("jsonExampleModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeJsonExampleModal();
      }
    });
  }

  // Bind click handlers to all example cards
  const exampleCards = document.querySelectorAll(".json-example-card");
  exampleCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent multiple triggers
      e.stopPropagation();
      
      const exampleType = card.getAttribute("data-example");
      if (exampleType) {
        handleExampleSelection(exampleType);
      }
    });
  });
  
  // Add visual feedback - make cards look clickable
  const style = document.createElement('style');
  style.textContent = `
    .json-example-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .json-example-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `;
  document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeModalHandlers);
} else {
  initializeModalHandlers();
}