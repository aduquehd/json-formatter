declare var Notyf: any;

let notyfInstance: any = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 50; // 5 seconds max
const pendingNotifications: Array<{ type: string; message: string }> = [];

function initializeNotyf(): void {
  initAttempts++;

  // Check if window.notyf is available (initialized in HTML)
  if (typeof window !== "undefined" && (window as any).notyf) {
    notyfInstance = (window as any).notyf;

    // Process any pending notifications
    while (pendingNotifications.length > 0) {
      const notification = pendingNotifications.shift();
      if (notification) {
        showNotification(notification.type, notification.message);
      }
    }
  } else if (typeof window !== "undefined" && typeof Notyf !== "undefined") {
    // Fallback: create our own instance if Notyf is available but not initialized
    notyfInstance = new Notyf({
      duration: 5000,
      position: {
        x: "right",
        y: "top",
      },
      types: [
        {
          type: "success",
          background: "green",
        },
        {
          type: "error",
          background: "indianred",
        },
        {
          type: "warning",
          background: "orange",
          icon: false,
        },
        {
          type: "info",
          background: "#3498db",
          icon: false,
        },
      ],
    });
    (window as any).notyf = notyfInstance;

    // Process any pending notifications
    while (pendingNotifications.length > 0) {
      const notification = pendingNotifications.shift();
      if (notification) {
        showNotification(notification.type, notification.message);
      }
    }
  } else if (initAttempts < MAX_INIT_ATTEMPTS) {
    // Try again in 100ms
    setTimeout(initializeNotyf, 100);
  } else {
    console.error("Failed to initialize Notyf after maximum attempts");
    // Fallback to console logging
    while (pendingNotifications.length > 0) {
      const notification = pendingNotifications.shift();
      if (notification) {
        console.log(`[${notification.type.toUpperCase()}] ${notification.message}`);
      }
    }
  }
}

function showNotification(type: string, message: string): void {
  if (notyfInstance) {
    try {
      // Notyf uses different method names
      switch (type) {
        case "success":
          notyfInstance.success(message);
          break;
        case "error":
          notyfInstance.error(message);
          break;
        case "warning":
        case "info":
          // For custom types, use open method
          notyfInstance.open({
            type: type,
            message: message,
          });
          break;
        default:
          console.error(`Invalid notification type: ${type}`);
          console.log(`[${type.toUpperCase()}] ${message}`);
      }
    } catch (error) {
      console.error("Error showing Notyf notification:", error);
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  } else {
    // Queue the notification
    pendingNotifications.push({ type, message });

    // If we haven't started initialization yet, start it
    if (initAttempts === 0) {
      initializeNotyf();
    }
  }
}

export function showSuccess(message: string): void {
  showNotification("success", message);
}

export function showError(message: string): void {
  showNotification("error", message);
}

export function showWarning(message: string): void {
  showNotification("warning", message);
}

export function showInfo(message: string): void {
  showNotification("info", message);
}

// Initialize Notyf when the module loads
if (typeof window !== "undefined") {
  // Wait for window load to ensure all scripts are loaded
  window.addEventListener("load", () => {
    // Give a small delay to ensure deferred scripts are executed
    setTimeout(initializeNotyf, 100);
  });

  // Also try on DOMContentLoaded as a backup
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initializeNotyf, 500);
    });
  } else {
    // If the document is already loaded, initialize immediately
    setTimeout(initializeNotyf, 100);
  }
}
