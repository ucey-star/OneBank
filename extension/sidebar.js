// sidebar.js

let isLoggedIn = false; // Cache to track login state
let userFirstName = "";
// Global cache of last known merchant & amount
let lastMerchant = "Unknown";
let lastAmount = "Unknown";
let defaultRewardType = "";
let autoChecked = false;


document.addEventListener("DOMContentLoaded", async () => {
    const statusElement = document.getElementById("plugin-status");
    const logoutButton = document.getElementById("logout-button");

    // Always get latest login state from storage
    // Get the login state from Chrome storage
    chrome.storage.local.get(["isLoggedIn", "userFirstName"], async (data) => {
        // Update the global variable
        isLoggedIn = data.isLoggedIn === true;
        userFirstName = data.userFirstName;
        console.log("🔍 Retrieved isLoggedIn from storage:", isLoggedIn);

        logoutButton.style.display = isLoggedIn ? "block" : "none";

        if (isLoggedIn && userFirstName) {
            const welcomeText = document.getElementById("welcome-text");
            welcomeText.textContent = `Hello, ${userFirstName}!`;
            await autoExtractData();
        }

        // (Optional) Force a fresh check if needed
        if (!isLoggedIn) {
            showLoginForm();
            const freshStatus = await checkLoginStatus();
            isLoggedIn = freshStatus;
            logoutButton.style.display = freshStatus ? "block" : "none";
            console.log("🌐 Fetched fresh login status:", freshStatus);
        }
    });

    logoutButton.addEventListener("click", async () => {
        // Call the logout endpoint via a message to the background script
        chrome.runtime.sendMessage({ action: "logoutUser" }, (response) => {
            if (response && response.success) {
                // Clear login state from local storage and update UI
                chrome.storage.local.set({ isLoggedIn: false, userFirstName: "", defaultRewardType: ""}, () => {
                    isLoggedIn = false;
                    logoutButton.style.display = "none";
                    statusElement.textContent = "Logged out successfully.";
                     // Clear the welcome text
            const welcomeText = document.getElementById("welcome-text");
            resetPlugin();
            if (welcomeText) {
                welcomeText.textContent = "";
            }
                    showLoginForm();
                    
                });
            } else {
                console.error("Logout failed:", response.error);
            }
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

    if (!isLoggedIn) {
        extractionButton.textContent = "🔐 Enter Your Login Credentials from One Bank";
    }
}

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
    lastMerchant = merchant;
    lastAmount = amount;

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
            <div class="button-group">
                <button id="show-recommended-card" class="btn-primary" type="button" disabled>Best Card</button>
                <button id="submit-edits" class="btn-secondary" type="button" disabled>View Full Analysis</button>
            </div>

        </form>
    `;
    formContainer.style.display = 'block';
    const rewardSelect = document.getElementById('reward-type');
    
    // Fetch user's default reward type from storage and set it
    chrome.storage.local.get(["defaultRewardType"], (data) => {
        console.log("🔍 Retrieved defaultRewardType from storage:", data.defaultRewardType);
        defaultRewardType = data.defaultRewardType || "cashback";
        rewardSelect.value = defaultRewardType;

        validateFields();
    });
    
    // Grab references
    const merchantInput = document.getElementById('merchant-input');
    const amountInput = document.getElementById('amount-input');
    const submitButton = document.getElementById('submit-edits');
    const bestCardButton = document.getElementById('show-recommended-card');
    const errorDiv = document.getElementById('form-error');

    let autoUpdateTimer = null;

    // Function to validate fields
    function validateFields() {
        const merchantVal = merchantInput.value.trim();
        const amountVal = amountInput.value.trim();
        const rewardType = rewardSelect.value; 

        console.log("elcted reward type", rewardType);
    
        let isValid = true;
        let errorMsg = "";
    
        // 1) Merchant must not be "Unknown" or empty
        if (!merchantVal || merchantVal.toLowerCase() === "unknown") {
            isValid = false;
            errorMsg += "• Please provide a valid merchant (not 'Unknown').\n";
        }
    
        // 2) Amount must be numeric or currency-like
        // We'll accept digits, optional $, optional decimal
        const currencyPattern = /^(\$?\d+(\.\d+)?)$/;
        if (!currencyPattern.test(amountVal)) {
            isValid = false;
            errorMsg += "• Please enter a valid amount (e.g. 12.99 or $12.99).\n";
        }
    
        // If invalid, show errors and disable submit
        if (!isValid) {
            errorDiv.textContent = errorMsg.trim();
            submitButton.disabled = true;
            bestCardButton.disabled = true;
        } else {
            // Clear any errors
            errorDiv.textContent = "";
            submitButton.disabled = false;
            bestCardButton.disabled = false;
    
            // Only auto-check once
            if (!autoChecked) {
                // Debounce auto-update
                if (autoUpdateTimer) {
                    clearTimeout(autoUpdateTimer);
                }
                autoUpdateTimer = setTimeout(() => {
                    autoChecked = true; // Mark as done
                    handleRewardCheck(merchantVal, amountVal, rewardType, true);
                }, 500);
            }
        }
    }

    // Validate on input changes
    merchantInput.addEventListener('input', validateFields);
    amountInput.addEventListener('input', validateFields);

    // Run an initial validation pass
    validateFields();

    bestCardButton.addEventListener('click', () => {
        if (!bestCardButton.disabled) {
            const merchant = merchantInput.value.trim();
            const amount = amountInput.value.trim();
            const rewardType = document.getElementById('reward-type').value;
    
            handleRewardCheck(merchant, amount, rewardType, true); // true indicates "Best Card only"
        }
    });

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

function handleRewardCheck(merchant, amount, rewardType, bestCardOnly = false) {
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
            handleEditedDataWithReward(merchant, amount, rewardType,  bestCardOnly);
        } else {
            console.log("rewardType", rewardType);
            // Otherwise, show a warning with the suggested reward type
            showRewardWarning(response.suggestedRewardType, merchant, amount, rewardType, bestCardOnly);
        }
    })
    .catch(err => {
        console.error("Error checking reward type:", err);
        // In case of error, you may decide to proceed anyway
        handleEditedDataWithReward(merchant, amount, rewardType, bestCardOnly);
    });
}

function showRewardWarning(suggestedReward, merchant, amount, currentReward, bestCardOnly) {
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
        handleEditedDataWithReward(merchant, amount, currentReward, bestCardOnly);
    });
}

async function handleEditedDataWithReward(merchant, amount, rewardType, bestCardOnly = false) {
    if (!isLoggedIn) {
        return;
    }
    const recommendationContainer = document.getElementById('recommendation-container');
    recommendationContainer.style.display = 'block';
    recommendationContainer.innerHTML = "<div class='spinner'></div>";

    const reqData = {
        merchant,
        amount: parseFloat(amount.replace(/[^0-9.]/g, "")) || 0.0,
        rewardType
    };

    chrome.runtime.sendMessage({ action: 'getCardAdvice', data: reqData }, function(response) {
        if (response.error) {
            recommendationContainer.textContent = "An error occurred while fetching recommendations.";
            return;
        }

        const analysis = response.result;

        recommendationContainer.innerHTML = "";

        // If "Best Card" clicked, show only the recommended card
        if (bestCardOnly) {
            const bestCardDiv = document.createElement("div");
            bestCardDiv.classList.add("best-card-only");
            bestCardDiv.innerHTML = `
                <h4>🌟 Best Card Recommendation</h4>
                <p><strong>${analysis.recommendedCard || "No ideal card found."}</strong></p>
            `;
            // Create a flex container to hold both buttons
            const buttonRow = document.createElement("div");
            buttonRow.classList.add("button-row"); // We'll define .button-row in CSS

            // Create the "View Full Analysis" button
            const toggleBtn = document.createElement("button");
            toggleBtn.id = "toggle-full-analysis";
            toggleBtn.classList.add("btn-secondary");
            toggleBtn.textContent = "View Full Analysis";
            toggleBtn.addEventListener("click", () => {
            handleEditedDataWithReward(merchant, amount, rewardType, false);
            });

            // Create the "New Transaction" button
            const resetBtn = document.createElement("button");
            resetBtn.id = "reset-transaction";
            resetBtn.classList.add("action-button");
            resetBtn.textContent = "New Transaction";
            resetBtn.addEventListener("click", resetPlugin);

            // Add both buttons to the buttonRow
            buttonRow.appendChild(toggleBtn);
            buttonRow.appendChild(resetBtn);

            // Finally, place buttonRow inside bestCardDiv, then append bestCardDiv
            bestCardDiv.appendChild(buttonRow);
            recommendationContainer.appendChild(bestCardDiv);

        } else {
            // Full analysis view
            const sortedResults = sortAnalysisResults(analysis.analysisResults, rewardType);
            renderTable(sortedResults, analysis.recommendedCard, rewardType);

            const explanationCard = document.createElement("div");
            explanationCard.classList.add("analysis-card");
            explanationCard.innerHTML = `
                <h4>Analysis Explanation:</h4>
                <p class="analysis-explanation">${analysis.explanation}</p>
                <p><strong>Recommended Card:</strong> ${analysis.recommendedCard || "None"}</p>
            `;
            // Create a button row
            const buttonRow = document.createElement("div");
            buttonRow.classList.add("button-row");


            // “New Transaction” button
            const resetBtn = document.createElement("button");
            resetBtn.id = "reset-transaction";
            resetBtn.classList.add("action-button");
            resetBtn.textContent = "New Transaction";
            resetBtn.addEventListener("click", resetPlugin);

            // Add both buttons to the buttonRow
            buttonRow.appendChild(resetBtn);

            // Append the button row into the explanation card
            explanationCard.appendChild(buttonRow);
            recommendationContainer.appendChild(explanationCard);
                    }
                });
            }


function renderTable(analysisResults, recommendedCard, selectedRewardType) {
    const recommendedIndex = analysisResults.findIndex(
        (item) => item.cardName === recommendedCard
    );
    if (recommendedIndex > 0) {
        const [recItem] = analysisResults.splice(recommendedIndex, 1);
        analysisResults.unshift(recItem);
    }
    
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
        
        // If this row is the recommended card, add a special highlight
        if (item.cardName === recommendedCard) {
            row.classList.add("recommended-row");
        }

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


// Make this function regular or async (either is fine),
// but the crucial part is the 'click' callback must be async
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
      <!-- Error message placeholder -->
      <div id="login-error" style="color: red; font-size: 0.9rem; margin-bottom: 0.5rem;"></div>
      <button id="login-submit" type="button" class="login-button">Login</button>
    </form>
    <!-- Divider -->
    <div class="divider" style="text-align: center; margin: 1rem 0;">
      <hr style="display:inline-block; width:40%; vertical-align:middle;">
      <span style="margin:0 0.5rem; color:#666;">OR</span>
      <hr style="display:inline-block; width:40%; vertical-align:middle;">
    </div>
    <!-- Google Sign-In Button -->
    <button id="google-login-button" class="google-login-button" style="width: 100%; padding: 0.8rem; border: 1px solid #ccc; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
      <img src="icons/google_icon.webp" alt="Google Icon" class="google-icon" style="width:24px; height:24px; margin-right: 8px;" />
      Sign In with Google
    </button>
  `;
    formContainer.style.display = 'block';

    const loginErrorDiv = document.getElementById('login-error');

    document.getElementById('google-login-button').addEventListener('click', async () => {
        // Clear any previous error message
        loginErrorDiv.textContent = "";
      
        // Send a message to the background script to initiate Google Auth
        chrome.runtime.sendMessage({ action: 'initiateGoogleAuth' }, async (response) => {
          if (response.success) {
            // Update local storage with the new login state and user info
            chrome.storage.local.set(
              {
                isLoggedIn: true,
                userFirstName: response.user.first_name,
                defaultRewardType: response.user.default_reward_type.toLowerCase()
              },
              () => {
                // Update the UI
                console.log("🔑 Logged in via Google:", response.user.first_name);
                document.getElementById('welcome-text').textContent = `Hello, ${response.user.first_name}!`;
                document.getElementById('plugin-status').textContent = "Logged in successfully via Google!";
                formContainer.style.display = 'none';
                defaultRewardType = response.user.default_reward_type.toLowerCase();
                isLoggedIn =  true
              }
            );
      
            // Optionally auto-extract data after login
            await autoExtractData();
      
            // Show the logout button, hide the login button
            const logoutButton = document.getElementById("logout-button");
            const loginButton = document.getElementById("login-button");
            if (logoutButton) {
              logoutButton.style.display = "block";
            }
            loginButton.style.display = "none";
      
          } else {
            // Display the error inside the form
            loginErrorDiv.textContent = response.error || "Google login failed. Please try again.";
          }
        });
      });
      

    // The important part is marking this click callback as async 
    document.getElementById('login-submit').addEventListener('click', async () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        // Basic local validation
        if (!email || !password) {
            loginErrorDiv.textContent = "Please enter both email and password.";
            return;
        }

        // Clear any previous error
        loginErrorDiv.textContent = "";

        // Perform login by sending a message to the background script
        chrome.runtime.sendMessage(
            { action: 'performLogin', credentials: { email, password } }, 
            async (response) => {
                if (response.success) {
                    // Update local storage and UI
                    chrome.storage.local.set(
                        { isLoggedIn: true, userFirstName: response.user.first_name, defaultRewardType: response.user.default_reward_type.toLowerCase() }, 
                        () => {
                            document.getElementById('welcome-text').textContent = 
                                `Hello, ${response.user.first_name}!`;
                            document.getElementById('plugin-status').textContent = 
                                "Logged in successfully!";
                            // Hide login form
                            formContainer.style.display = 'none';
                            defaultRewardType = response.user.default_reward_type.toLowerCase();
                            isLoggedIn =  true
                        }
                    );

                    // Now that you're async here, you can safely do:
                    await autoExtractData(); 

                    const logoutButton = document.getElementById("logout-button");
                    const loginButton = document.getElementById("login-button");
                    if (logoutButton) {
                        logoutButton.style.display = "block";
                    }
                    loginButton.style.display = "none";
                } else {
                    // Display the error inside the form
                    loginErrorDiv.textContent = response.error || "Login failed. Please try again.";
                }
            }
        );
    });
}

function resetPlugin() {
    // 1. Clear/hide the recommendation container
    const recommendationContainer = document.getElementById('recommendation-container');
    recommendationContainer.innerHTML = "";
    recommendationContainer.style.display = 'none';
    autoChecked = false;

    // 2. Clear/hide the form container
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = "";
    formContainer.style.display = 'none';

    // 3. Reset the status badge text
    const pluginStatus = document.getElementById('plugin-status');
    if (pluginStatus) {
        pluginStatus.textContent = "Status: Waiting for action...";
    }
    showEditableForm(lastMerchant, lastAmount);
}

function sortAnalysisResults(results, rewardType) {
    // Make a shallow copy so we don’t mutate the original
    const sorted = [...results];
    
    // Sort by whichever reward type the user selected
    if (rewardType === 'cashback') {
        sorted.sort((a, b) => parseFloat(b.cashback) - parseFloat(a.cashback));
    } else if (rewardType === 'miles') {
        sorted.sort((a, b) => parseFloat(b.miles) - parseFloat(a.miles));
    } else if (rewardType === 'points') {
        sorted.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
    }
    
    return sorted;
}

async function autoExtractData() {
    const statusElement = document.getElementById('plugin-status');
    statusElement.textContent = 'Extracting merchant details and transaction cost...';

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
}});