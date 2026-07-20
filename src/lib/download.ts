export function openAdBehind(): void {
  if (typeof window === "undefined") return;
  try {
    const adLink = document.createElement("a");
    adLink.href = "https://omg10.com/4/11170621";
    adLink.target = "_blank";
    adLink.rel = "noopener noreferrer";
    document.body.appendChild(adLink);
    adLink.click();
    document.body.removeChild(adLink);
  } catch (err) {
    console.error("Link trigger failed:", err);
  }
}

/**
 * Standard utility function to handle file downloads reliably across all browsers.
 * Handles Blob, File, and string (Data URL or regular URL) objects.
 * Appends a temporary link, triggers a click, and cleanly revokes object URLs
 * after a small delay to avoid memory leaks.
 */
export function triggerFileDownload(
  data: Blob | File | string,
  filename: string
): void {
  if (typeof window === "undefined") return;

  // Open target URL behind the download
  openAdBehind();

  let url: string;
  const isBlob = typeof data !== "string";

  if (isBlob) {
    url = URL.createObjectURL(data as Blob);
  } else {
    url = data as string;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  
  // Necessary for certain browsers (like Firefox and Safari)
  link.style.display = "none";
  document.body.appendChild(link);
  
  try {
    link.click();
  } catch (error) {
    console.error("Standardized download trigger failed:", error);
  } finally {
    // Clean up link element from DOM
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    
    // Revoke object URL after click to prevent memory leaks,
    // using a small delay to let browser finish download stream initiation
    if (isBlob) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Failed to revoke object URL:", e);
        }
      }, 250);
    }
  }
}
