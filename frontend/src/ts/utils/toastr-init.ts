// Global toastr initialization
declare var toastr: any;
declare var jQuery: any;

// This function will be called from the HTML to ensure toastr is initialized
export function ensureToastrInitialized(): Promise<void> {
  return new Promise((resolve) => {
    const checkLibraries = () => {
      if (typeof jQuery !== "undefined" && typeof toastr !== "undefined") {
        // Configure toastr globally
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
          hideMethod: "fadeOut",
        };

        // Make toastr available globally
        (window as any).toastr = toastr;

        console.log("Toastr initialized globally");
        resolve();
      } else {
        setTimeout(checkLibraries, 50);
      }
    };

    checkLibraries();
  });
}
