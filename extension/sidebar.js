// sidebar.js

let isLoggedIn = false; // Cache to track login state

document.addEventListener("DOMContentLoaded", async () => {
    const extractionButton = document.getElementById("start-extraction");
    const statusElement = document.getElementById("plugin-status");

    // Always get latest login state from storage
    chrome.storage.local.get(["isLoggedIn"], async (data) => {
        const isLoggedIn = data.isLoggedIn === true; // Explicitly check for `true`
        console.log("🔍 Retrieved isLoggedIn from storage:", isLoggedIn);

        if (isLoggedIn) {
            updateExtractionButton(true); // User is logged in
        } else {
            const freshStatus = await checkLoginStatus(); // Fetch fresh status
            updateExtractionButton(freshStatus);
            console.log("🌐 Fetched fresh login status:", freshStatus);
        }
    });

    extractionButton.addEventListener("click", async () => {
        chrome.storage.local.get(["isLoggedIn"], async (data) => {
            const isLoggedIn = data.isLoggedIn === true; // Ensure boolean check
            console.log("🛑 Checking login before extraction:", isLoggedIn);

            if (!isLoggedIn) {
                statusElement.textContent = "Please log in to extract data.";
                showLoginForm();
                return;
            }

            statusElement.textContent = 'Extracting merchant details and transaction cost...';

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "extract_data" }, (response) => {
                    if (response && response.merchant_name && response.transaction_amount) {
                        statusElement.textContent = 'Data extracted. Edit if needed:';
                        showEditableForm(response.merchant_name, response.transaction_amount);
                    } else {
                        statusElement.textContent = 'Unable to extract details. Please enter manually.';
                        showEditableForm("Unknown", "Unknown");
                    }
                });
            });
        });
    });
});


// Function to update button label based on authentication
function updateExtractionButton(isLoggedIn) {
    const extractionButton = document.getElementById("start-extraction");
    if (!extractionButton) {
        console.error("⚠️ Extraction button not found!");
        return;
    }
    console.error("ISLOGGEDIN!", isLoggedIn);

    extractionButton.textContent = isLoggedIn 
        ? "🔍 Extract Merchant & Transaction"
        : "🔐 Enter Your Login Credentials from One Bank";
}


// Event listener for the "Start Extraction" button
document.getElementById('start-extraction').addEventListener('click', async () => {
    const statusElement = document.getElementById('plugin-status');
    const formContainer = document.getElementById('form-container');
    const recommendationContainer = document.getElementById('recommendation-container');

    // Re-validate login status if not logged in
    if (!isLoggedIn) {
        isLoggedIn = await checkLoginStatus();
    }

    if (!isLoggedIn) {
        statusElement.textContent = "Please log in to extract data.";
        showLoginForm();
        return;
    }

    statusElement.textContent = 'Extracting merchant details and transaction cost...';
    formContainer.style.display = 'none';
    recommendationContainer.style.display = 'none';

    // Send a message to the content script to extract data from the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "extract_data" }, (response) => {
            if (response && response.merchant_name && response.transaction_amount) {
                statusElement.textContent = 'Data extracted. Edit if needed:';
                showEditableForm(response.merchant_name, response.transaction_amount);
            } else {
                statusElement.textContent = 'Unable to extract details. Please enter manually.';
                showEditableForm("Unknown", "Unknown");
            }
        });
    });
});

// Event listener for the "Open Website" button
document.getElementById('open-website').addEventListener('click', () => {
    const websiteUrl = 'https://onebankapp.onrender.com'; // Replace with your website URL
    chrome.tabs.create({ url: websiteUrl });
});

// Function to check login status by communicating with the background script
async function checkLoginStatus() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'checkLoginStatus' }, function(response) {
            const isLoggedIn = response.is_logged_in === true; // Explicitly check for true
            console.log("🔑 Received login status from background:", response.isLoggedIn);
            //console.log("🔑 Received login status from background:", isLoggedIn);

            chrome.storage.local.set({ isLoggedIn }, () => {
                console.log("💾 Stored isLoggedIn in chrome.storage:", isLoggedIn);
                resolve(isLoggedIn);
            });
        });
    });
}



// Function to display an editable form with extracted or default data
function showEditableForm(merchant, amount) {
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = `
        <form id="edit-form" class="edit-form">
            <div class="form-group">
                <label for="merchant-input" class="form-label">Merchant:</label>
                <input type="text" id="merchant-input" name="merchant" value="${merchant}" class="form-input">
            </div>
            <div class="form-group">
                <label for="amount-input" class="form-label">Amount:</label>
                <input type="text" id="amount-input" name="amount" value="${amount}" class="form-input">
            </div>
            <div class="form-group">
                <label for="reward-type" class="form-label">Select Reward Type:</label>
                <select id="reward-type" name="reward-type" class="form-select">
                    <option value="cashback">Cashback</option>
                    <option value="mileage">Mileage Points</option>
                    <option value="reward">Reward Points</option>
                </select>
            </div>
            <button id="submit-edits" type="button" class="btn-submit">Submit</button>
        </form>
    `;
    formContainer.style.display = 'block';

    document.getElementById('submit-edits').addEventListener('click', () => {
        const editedMerchant = document.getElementById('merchant-input').value;
        const editedAmount = document.getElementById('amount-input').value;
        const rewardType = document.getElementById('reward-type').value;
        // Instead of immediately calling handleEditedDataWithReward,
        // first check whether the reward type is suitable.
        handleRewardCheck(editedMerchant, editedAmount, rewardType);
    });
}

function handleRewardCheck(merchant, amount, rewardType) {
    const data = { merchant, amount, rewardType };
    // Adjust API_URL if necessary
    fetch(`http://127.0.0.1:5000/api/check_reward_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        if (response.isSuitable) {
            // If the reward type is suitable, continue with analysis
            handleEditedDataWithReward(merchant, amount, rewardType);
        } else {
            // Otherwise, show a warning with the suggested reward type
            showRewardWarning(response.suggestedRewardType, merchant, amount, rewardType);
        }
    })
    .catch(err => {
        console.error("Error checking reward type:", err);
        // In case of error, you may decide to proceed anyway
        handleEditedDataWithReward(merchant, amount, rewardType);
    });
}

function showRewardWarning(suggestedReward, merchant, amount, currentReward) {
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = `
        <div class="reward-warning">
            <h3 class="warning-heading">⚠️ Heads Up!</h3>
            <p>Your selected reward type ("${currentReward}") may not be optimal for ${merchant}.</p>
            <p>We suggest using "<strong>${suggestedReward}</strong>" instead.</p>
            <p>You can either update your selection or proceed with your current choice.</p>
            <div class="warning-buttons">
                <button id="update-reward" class="btn-update">Update Selection</button>
                <button id="proceed-anyway" class="btn-proceed">Proceed Anyway</button>
            </div>
        </div>
    `;
    formContainer.style.display = 'block';

    document.getElementById('update-reward').addEventListener('click', () => {
        showEditableForm(merchant, amount);
    });

    document.getElementById('proceed-anyway').addEventListener('click', () => {
        // 1. Clear the container's content
        formContainer.innerHTML = '';
        // 2. Hide the container completely (no leftover space)
        formContainer.style.display = 'none';

        // Continue with the analysis
        handleEditedDataWithReward(merchant, amount, currentReward);
    });
}


// Function to handle the data after the user edits or confirms it
async function handleEditedDataWithReward(merchant, amount, rewardType) {
    const recommendationContainer = document.getElementById('recommendation-container');
    recommendationContainer.style.display = 'block';

    chrome.storage.local.get(["isLoggedIn"], async (data) => {
        if (!data.isLoggedIn) {
            recommendationContainer.textContent = "Please log in to view recommendations.";
            showLoginForm();
            return;
        }
    });

    // Remove non-numeric characters from amount
    let cleanedAmount = amount.replace(/[^0-9.]/g, "");
    let parsedAmount = parseFloat(cleanedAmount);
    if (isNaN(parsedAmount)) {
        console.warn("⚠️ Amount is NaN. Defaulting to 0.0");
        parsedAmount = 0.0;
    }

    // Prepare the data object including the reward type
    const data = {
        category: merchant,
        amount: parsedAmount,
        rewardType: rewardType
    };

    console.log("🚀 Sending request to background script:", data);

    // Get card advice by sending a message to the background script
    chrome.runtime.sendMessage({ action: 'getCardAdvice', data }, function(response) {
        if (response.error) {
            console.error("Error fetching card advice:", response.error);
            recommendationContainer.textContent = "An error occurred while fetching recommendations.";
            return;
        }

        const cardResult = response.result;
        recommendationContainer.textContent = `Recommended Card: ${cardResult.recommended_card}`;
        const cardType = cardResult.recommended_card;

        // Fetch full card details based on the recommended card type
        chrome.runtime.sendMessage({ action: 'getFullCardDetails', cardType }, function(response) {
            if (response.error) {
                console.error("Error fetching full card details:", response.error);
                recommendationContainer.textContent = "An error occurred while fetching card details.";
                return;
            }

            const fullCardDetails = response.result;
            // Display the full card details
            recommendationContainer.innerHTML = `
                <h3>Recommended Card Details:</h3>
                <p><strong>Card Holder:</strong> ${fullCardDetails.cardHolderName}</p>
                <p>
                    <strong>Card Number:</strong>
                    <span id="cardNumber" class="blurred">${fullCardDetails.cardNumber}</span>
                    <button id="copyCardNumber">📋</button>
                </p>
                <p>
                    <strong>Expiry Date:</strong>
                    <span id="expiryDate" class="blurred">${fullCardDetails.expiryDate}</span>
                    <button id="copyExpiryDate">📋</button>
                </p>
                <p>
                    <strong>CVV:</strong>
                    <span id="cvv" class="blurred">${fullCardDetails.cvv}</span>
                    <button id="copyCVV">📋</button>
                </p>
                <p><strong>Issuer:</strong> ${fullCardDetails.issuer}</p>
                <p><strong>Card Type:</strong> ${fullCardDetails.cardType}</p>
            `;

            // Add event listeners for copy buttons
            document.getElementById('copyCardNumber').addEventListener('click', () => {
                copyToClipboard(fullCardDetails.cardNumber);
            });
            document.getElementById('copyExpiryDate').addEventListener('click', () => {
                copyToClipboard(fullCardDetails.expiryDate);
            });
            document.getElementById('copyCVV').addEventListener('click', () => {
                copyToClipboard(fullCardDetails.cvv);
            });
        });
    });
}


// Function to display the login form
function showLoginForm() {
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = `
        <form id="login-form" class="login-form">
            <h3 class="login-heading">Log In</h3>
            <div class="login-group">
                <label for="email-input" class="login-label">Email</label>
                <input type="email" id="email-input" name="email" class="login-input" required>
            </div>
            <div class="login-group">
                <label for="password-input" class="login-label">Password</label>
                <input type="password" id="password-input" name="password" class="login-input" required>
            </div>
            <button id="login-submit" type="button" class="login-button">Login</button>
        </form>
    `;
    formContainer.style.display = 'block';

    document.getElementById('login-submit').addEventListener('click', () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        // Perform login by sending a message to the background script
        chrome.runtime.sendMessage({ action: 'performLogin', credentials: { email, password } }, function(response) {
            if (response.success) {
                chrome.storage.local.set({ isLoggedIn: true }, () => {
                    updateExtractionButton(true);
                    document.getElementById('plugin-status').textContent = "Logged in successfully!";
                    document.getElementById('form-container').style.display = 'none';
                });
                // Hide the login form after successful login
                formContainer.style.display = 'none';
            } else {
                alert(response.error);
            }
        });
    });
}


// Function to copy text to the clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log('Copied to clipboard successfully!');
    }, function(err) {
        console.error('Could not copy text: ', err);
    });
}