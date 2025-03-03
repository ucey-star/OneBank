const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000"; // Default to localhost if env variable is missing
// const BASE_URL ="http://127.0.0.1:5000"; 

export async function downloadExtension() {
    const downloadUrl = `${BASE_URL}/download-extension`;
    
    try {
        // Trigger file download by setting the window location
        window.location.href = downloadUrl;
    } catch (error) {
        console.error("Error downloading extension:", error);
    }
}
