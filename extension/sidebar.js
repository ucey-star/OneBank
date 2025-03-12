// sidebar.js

let isLoggedIn = false; // Cache to track login state

document.addEventListener("DOMContentLoaded", async () => {
    const extractionButton = document.getElementById("start-extraction");
    const statusElement = document.getElementById("plugin-status");
    const logoutButton = document.getElementById("logout-button");

    // Always get latest login state from storage
    // Get the login state from Chrome storage
    chrome.storage.local.get(["isLoggedIn"], async (data) => {
        // Update the global variable
        isLoggedIn = data.isLoggedIn === true;
        console.log("🔍 Retrieved isLoggedIn from storage:", isLoggedIn);

        // Update UI based on login state
        updateExtractionButton(isLoggedIn);
        logoutButton.style.display = isLoggedIn ? "block" : "none";

        // (Optional) Force a fresh check if needed
        if (!isLoggedIn) {
            const freshStatus = await checkLoginStatus();
            isLoggedIn = freshStatus;
            updateExtractionButton(freshStatus);
            logoutButton.style.display = freshStatus ? "block" : "none";
            console.log("🌐 Fetched fresh login status:", freshStatus);
        }
    });

    logoutButton.addEventListener("click", async () => {
        // Call the logout endpoint via a message to the background script
        chrome.runtime.sendMessage({ action: "logoutUser" }, (response) => {
            if (response && response.success) {
                // Clear login state from local storage and update UI
                chrome.storage.local.set({ isLoggedIn: false }, () => {
                    isLoggedIn = false;
                    updateExtractionButton(false);
                    logoutButton.style.display = "none";
                    resetPlugin();
                    statusElement.textContent = "Logged out successfully.";
                    
                });
            } else {
                console.error("Logout failed:", response.error);
            }
        });
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
                        // 1) Remove any commas, spaces, etc. from the amount, keeping only digits, decimal, or '$'
                        let sanitizedAmount = response.transaction_amount.replace(/[^\d.\$]/g, "");
                        // If you also want to remove the '$' symbol, do: replace(/[^\d.]/g, "")
                        
                        // 2) Then call the form
                        statusElement.textContent = 'Data extracted. Edit if needed:';
                        showEditableForm(response.merchant_name, sanitizedAmount);
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
                let sanitizedAmount = response.transaction_amount.replace(/[^\d.\$]/g, "");
                statusElement.textContent = 'Data extracted. Edit if needed:';
                showEditableForm(response.merchant_name, sanitizedAmount);
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
    // We'll include an extra <div> to display errors inline
    formContainer.innerHTML = `
        <form id="edit-form" class="edit-form">
            <div class="form-group">
                <label for="merchant-input" class="form-label">Merchant:</label>
                <input type="text" id="merchant-input" name="merchant" value="${merchant}" class="form-input">
            </div>
            <div class="form-group">
                <label for="amount-input" class="form-label">Amount:</label>
                <input type="text" id="amount-input" name="amount" value="${amount}" class="form-input" placeholder="e.g $10.00,10.00 or 10">
            </div>
            <div class="form-group">
                <label for="reward-type" class="form-label">Select Reward Type:</label>
                <select id="reward-type" name="reward-type" class="form-select">
                    <option value="cashback">Cashback</option>
                    <option value="miles">Miles</option>
                    <option value="points">Points</option>
                </select>
            </div>
            <div id="form-error" style="color: red; font-size: 0.9rem; margin-bottom: 0.5rem;"></div>
            <button id="submit-edits" type="button" class="btn-submit" disabled>Submit</button>
        </form>
    `;
    formContainer.style.display = 'block';

    // Grab references
    const merchantInput = document.getElementById('merchant-input');
    const amountInput = document.getElementById('amount-input');
    const submitButton = document.getElementById('submit-edits');
    const errorDiv = document.getElementById('form-error');

    // Function to validate fields
    function validateFields() {
        const merchantVal = merchantInput.value.trim();
        const amountVal = amountInput.value.trim();

        let isValid = true;
        let errorMsg = "";

        // 1) Merchant must not be "Unknown" or empty
        if (!merchantVal || merchantVal.toLowerCase() === "unknown") {
            isValid = false;
            errorMsg += "• Please provide a valid merchant (not 'Unknown').\n";
        }

        // 2) Amount must be numeric or currency-like
        // We'll accept digits, optional $, optional decimal
        // Example pattern: ^(\$?\d+(\.\d{1,2})?)$
        const currencyPattern = /^(\$?\d+(\.\d+)?)$/;
        if (!currencyPattern.test(amountVal)) {
            isValid = false;
            errorMsg += "• Please enter a valid amount (e.g. 12.99 or $12.99).\n";
        }

        // If invalid, show errors and disable submit
        if (!isValid) {
            errorDiv.textContent = errorMsg.trim();
            submitButton.disabled = true;
        } else {
            // Clear errors, enable submit
            errorDiv.textContent = "";
            submitButton.disabled = false;
        }
    }

    // Validate on input changes
    merchantInput.addEventListener('input', validateFields);
    amountInput.addEventListener('input', validateFields);

    // Run an initial validation pass
    validateFields();

    // On submit button click
    submitButton.addEventListener('click', () => {
        // Double-check if form is valid
        if (!submitButton.disabled) {
            const editedMerchant = merchantInput.value.trim();
            const editedAmount = amountInput.value.trim();
            const rewardType = document.getElementById('reward-type').value;

            // If form is valid, proceed with existing logic
            handleRewardCheck(editedMerchant, editedAmount, rewardType);
        }
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

async function handleEditedDataWithReward(merchant, amount, rewardType) {
    const recommendationContainer = document.getElementById('recommendation-container');
    recommendationContainer.style.display = 'block';

    // Check if user is logged in
    chrome.storage.local.get(["isLoggedIn"], async (data) => {
        if (!data.isLoggedIn) {
            recommendationContainer.textContent = "Please log in to view recommendations.";
            showLoginForm();
            return;
        }
    });

    // Clean and parse the amount value
    let cleanedAmount = amount.replace(/[^0-9.]/g, "");
    let parsedAmount = parseFloat(cleanedAmount);
    if (isNaN(parsedAmount)) {
        console.warn("⚠️ Amount is NaN. Defaulting to 0.0");
        parsedAmount = 0.0;
    }

    // Prepare the request data
    const reqData = {
        merchant: merchant,
        amount: parsedAmount,
        rewardType: rewardType
    };

    console.log("🚀 Sending request to analyze rewards:", reqData);

    const spinner = document.createElement("div");
    spinner.classList.add("spinner");
    recommendationContainer.innerHTML = ""; // Clear old content
    recommendationContainer.appendChild(spinner);

    // Call your backend endpoint via background.js
    chrome.runtime.sendMessage({ action: 'getCardAdvice', data: reqData }, function(response) {
        if (response.error) {
            console.error("Error fetching reward analysis:", response.error);
            recommendationContainer.textContent = "An error occurred while fetching recommendations.";
            return;
        }

        const analysis = response.result; // Expected shape: { analysisResults, explanation, recommendedCard, ... }

        // Clear previous contents
        recommendationContainer.innerHTML = "";
        recommendationContainer.style.display = 'none'; // Temporarily hide

        // 1. Render the table
        console.log("📊 Analysis Results:", analysis.analysisResults);
        renderTable(analysis.analysisResults);

        // 2. Show the explanation
        const explanationCard = document.createElement("div");
        explanationCard.classList.add("analysis-card");
        explanationCard.innerHTML = `
            <h4>Analysis Explanation:</h4>
            <p class="analysis-explanation">${analysis.explanation}</p>
            <p><strong>Recommended Card:</strong> ${analysis.recommendedCard || "None"}</p>
        `;
        recommendationContainer.appendChild(explanationCard);

        // --- ADD THE NEW BUTTON HERE ---
        const resetBtn = document.createElement("button");
        resetBtn.id = "reset-transaction";
        resetBtn.classList.add("action-button");
        resetBtn.textContent = "New Transaction";

        // Append the button
        recommendationContainer.appendChild(resetBtn);

        // Listen for clicks to reset
        resetBtn.addEventListener("click", () => {
            resetPlugin();
        });


        // Display container again
        recommendationContainer.style.display = 'block';
    });
}

function renderTable(analysisResults) {
    const container = document.getElementById('recommendation-container');
  
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("analysis-card");
  
    const table = document.createElement("table");
    table.classList.add("analysis-table");
  
    // Create header row
    const headerRow = document.createElement("tr");

    // Card Name (horizontal)
    const cardNameTH = document.createElement("th");
    cardNameTH.textContent = "Card Name";
    headerRow.appendChild(cardNameTH);

    // Cashback (vertical)
    const cashbackTH = document.createElement("th");
    cashbackTH.classList.add("vertical-header");
    cashbackTH.textContent = "Cashback (%)";
    headerRow.appendChild(cashbackTH);

    // Miles (vertical)
    const milesTH = document.createElement("th");
    milesTH.classList.add("vertical-header");
    milesTH.textContent = "Miles (%)";
    headerRow.appendChild(milesTH);

    // Points (vertical)
    const pointsTH = document.createElement("th");
    pointsTH.classList.add("vertical-header");
    pointsTH.textContent = "Points (%)";
    headerRow.appendChild(pointsTH);

    table.appendChild(headerRow);

    // Build table rows
    analysisResults.forEach(item => {
        const row = document.createElement("tr");

        // Card Name
        const cardCell = document.createElement("td");
        cardCell.textContent = item.cardName;
        row.appendChild(cardCell);

        // Cashback
        const cashbackCell = document.createElement("td");
        cashbackCell.textContent = formatValue(item.cashback);
        row.appendChild(cashbackCell);

        // Miles
        const milesCell = document.createElement("td");
        milesCell.textContent = formatValue(item.miles);
        row.appendChild(milesCell);

        // Points
        const pointsCell = document.createElement("td");
        pointsCell.textContent = formatValue(item.points);
        row.appendChild(pointsCell);

        table.appendChild(row);
    });
    
    cardDiv.appendChild(table);
    container.appendChild(cardDiv);
}

/**
 * Rounds numeric values to 1 decimal place and adds a '%' sign, 
 * or returns "N/A" if invalid.
 */
function formatValue(value) {
    if (value == null || value === "N/A" || isNaN(value)) {
        return "N/A";
    }
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
        return "0.0%";
    }
    // Round to 1 decimal place
    const rounded = (Math.round(num * 10) / 10).toFixed(1);
    return `${rounded}%`;
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

                const logoutButton = document.getElementById("logout-button");
                if (logoutButton) {
                    logoutButton.style.display = "block";
                }
                
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

function resetPlugin() {
    // 1. Clear/hide the recommendation container
    const recommendationContainer = document.getElementById('recommendation-container');
    recommendationContainer.innerHTML = "";
    recommendationContainer.style.display = 'none';

    // 2. Clear/hide the form container
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = "";
    formContainer.style.display = 'none';

    // 3. Reset the status badge text
    const pluginStatus = document.getElementById('plugin-status');
    if (pluginStatus) {
        pluginStatus.textContent = "Status: Waiting for action...";
    }

    // 4. (Optional) If you want to show the "Extract Merchant & Transaction" button again
    //    or re-initialize something, you can do it here.
}
