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
        const response = await fetch('http://127.0.0.1:5000/status', {
            method: 'GET',
            credentials: 'include' // Include cookies
        });
        if (!response.ok) {
            throw new Error('Failed to fetch login status.');
        }
        const data = await response.json();
        return data.is_logged_in;
    } catch (error) {
        console.error("Error checking authentication:", error);
        return false;
    }
}

// Function to perform login
async function performLogin(credentials) {
    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify(credentials)
        });
        if (response.ok) {
            return { success: true };
        } else {
            const errorResult = await response.json();
            return { success: false, error: errorResult.error || "Login failed." };
        }
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "An error occurred during login." };
    }
}

// Function to get card advice from the backend
async function getCardAdvice(data) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/get_card_advice', {
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

// Function to get full card details from the backend
async function getFullCardDetails(cardType) {
    try {
        const url = `http://127.0.0.1:5000/api/get_full_card_details?cardType=${encodeURIComponent(cardType)}`;
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
