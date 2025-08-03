declare var toastr: any;
declare var jQuery: any;

let toastrReady = false;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 50; // 5 seconds max
const pendingNotifications: Array<{ type: string; message: string }> = [];

function initializeToastr(): void {
  initAttempts++;
  
  // Check if both jQuery and toastr are available
  if (typeof jQuery !== "undefined" && typeof toastr !== "undefined") {
    toastrReady = true;
    
    // Configure toastr options
    toastr.options = {
      closeButton: true,
      debug: false,
      newestOnTop: false,
      progressBar: true,
      positionClass: "toast-top-right",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut"
    };
    
    console.log("Toastr initialized successfully");
    
    // Process any pending notifications
    while (pendingNotifications.length > 0) {
      const notification = pendingNotifications.shift();
      if (notification) {
        showNotification(notification.type, notification.message);
      }
    }
  } else if (initAttempts < MAX_INIT_ATTEMPTS) {
    // Try again in 100ms
    setTimeout(initializeToastr, 100);
  } else {
    console.error("Failed to initialize toastr after maximum attempts");
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
  if (toastrReady && typeof toastr !== "undefined") {
    // Ensure we're calling the correct toastr method
    try {
      if (typeof toastr[type] === "function") {
        toastr[type](message);
      } else {
        console.error(`Invalid toastr method: ${type}`);
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    } catch (error) {
      console.error("Error showing toastr notification:", error);
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  } else {
    // Queue the notification
    pendingNotifications.push({ type, message });
    
    // If we haven't started initialization yet, start it
    if (initAttempts === 0) {
      initializeToastr();
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

// Initialize toastr when the module loads
if (typeof window !== "undefined") {
  // Wait for window load to ensure all scripts are loaded
  window.addEventListener("load", () => {
    // Give a small delay to ensure deferred scripts are executed
    setTimeout(initializeToastr, 100);
  });
  
  // Also try on DOMContentLoaded as a backup
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initializeToastr, 500);
    });
  }
}