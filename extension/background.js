// At the top of background.js
import { API_URL } from './config.js';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
  
console.log("Background script loaded!");

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Received message:", message.action);
    if (message.action === 'checkLoginStatus') {
        checkLoginStatus().then(status => {
            sendResponse({ is_logged_in: status });
        });
        return true; // Indicates an asynchronous response

    } else if (message.action === 'performLogin') {
        performLogin(message.credentials).then(result => {
            sendResponse(result);
        });
        return true;

    } else if (message.action === 'getCardAdvice') {
        getCardAdvice(message.data).then(result => {
            sendResponse({ result });
        }).catch(error => {
            sendResponse({ error: error.message });
        });
        return true;

    } else if (message.action === 'logoutUser') {
        // Call the /logout endpoint on your backend
        performLogout().then(result => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;

    } else if (message.action === 'getFullCardDetails') {
        getFullCardDetails(message.cardType).then(result => {
            sendResponse({ result });
        }).catch(error => {
            sendResponse({ error: error.message });
        });
        return true;

    } else if (message.action === 'extractData') {
        // Handle data extraction if necessary
        // You can define a function to handle this if needed
    } else if (message.action === 'initiateGoogleAuth') {
        console.log("Initiating Google auth...");
        // Append ?ext=1 so the server uses the extension's redirect URI.
        const authUrl = `${API_URL}/login/google?ext=1`;
        console.log("Auth URL:", authUrl);
        initiateGoogleAuth(authUrl)
          .then((result) => {
            console.log("Google auth successful, result:", result);
            sendResponse({ success: true, user: result.user, message: result.message });
          })
          .catch((error) => {
            console.error("Google auth failed:", error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      }
    });

// Function to check if the user is logged in by making a request to the backend
async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_URL}/status`, {
            method: 'GET',
            credentials: 'include' // Include cookies
        });
        if (!response.ok) {
            throw new Error('Failed to fetch login status.');
        }
        const data = await response.json();
        return data.isLoggedIn;
    } catch (error) {
        console.error("Error checking authentication:", error);
        return false;
    }
}

// Function to perform login
async function performLogin(credentials) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(credentials)
      });
  
      // Parse the JSON body
      const data = await response.json();
  
      if (response.ok) {
        // data.user should now be available
        return {
          success: true,
          user: {
            first_name: data.user.first_name,
            default_reward_type: data.user.default_reward_type
            // you can include other fields here if needed
          }
        };
      } else {
        return {
          success: false,
          error: data.error || "Login failed."
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "An error occurred during login."
      };
    }
  }
  

// Function to get card advice from the backend
async function getCardAdvice(data) {
    try {
        const response = await fetch(`${API_URL}/api/analyze_rewards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get card advice.");
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error fetching card advice:", error);
        throw error;
    }
}

async function performLogout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Logout failed.');
        }
        return true;
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
}

// Function to get full card details from the backend
async function getFullCardDetails(cardType) {
    try {
        const url = `${API_URL}/api/get_full_card_details?cardType=${encodeURIComponent(cardType)}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include', // Include cookies
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get full card details.");
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error fetching full card details:", error);
        throw error;
    }
}

async function initiateGoogleAuth(authUrl) {
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        async (redirectUrl) => {
          if (chrome.runtime.lastError) {
            console.error("Launch Web Auth Flow error:", chrome.runtime.lastError.message);
            return reject(new Error(chrome.runtime.lastError.message));
          }
          console.log("Redirect URL received:", redirectUrl);
          try {
            // Since the final redirect is handled by the server to include query parameters,
            // parse the URL and extract those parameters.
            const urlObj = new URL(redirectUrl);
            const success = urlObj.searchParams.get("success") === "true";
            if (success) {
              const user = {
                email: urlObj.searchParams.get("email"),
                first_name: urlObj.searchParams.get("first_name"),
                last_name: urlObj.searchParams.get("last_name"),
                default_reward_type: urlObj.searchParams.get("default_reward_type")
              };
              const message = urlObj.searchParams.get("message");
              resolve({ success, user, message });
            } else {
              reject(new Error("Google login unsuccessful"));
            }
          } catch (error) {
            console.error("Error processing redirect URL:", error);
            reject(new Error("Error processing auth result: " + error.message));
          }
        }
      );
    });
  }
  
  