// At the top of background.js
import { API_URL } from './config.js';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
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
    }

    // Handle other actions if needed
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
