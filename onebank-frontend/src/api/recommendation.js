if (!process.env.REACT_APP_API_BASE_URL) {
    throw new Error(
      "Missing REACT_APP_API_BASE_URL in the environment variables. Please set it and rebuild."
    );
  }
  
  // Use the environment variable directly
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function fetchRecommendationHistory(startDate = null, endDate = null) {
    let url = `${BASE_URL}/api/recommendation-history`;

    // Only append query parameters if startDate and endDate are provided
    if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
    }

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
        throw new Error("Failed to fetch recommendation history");
    }
    
    return response.json();
}
