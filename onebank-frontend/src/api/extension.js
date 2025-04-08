if (!process.env.REACT_APP_API_BASE_URL) {
    throw new Error(
      "Missing REACT_APP_API_BASE_URL in the environment variables. Please set it and rebuild."
    );
  }
  
  // Use the environment variable directly
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function downloadExtension() {
    const downloadUrl = `${BASE_URL}/download-extension`;
    
    try {
        // Trigger file download by setting the window location
        window.location.href = downloadUrl;
    } catch (error) {
        console.error("Error downloading extension:", error);
    }
}
