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

    // Clean and parse the amount value
    let cleanedAmount = amount.replace(/[^0-9.]/g, "");
    let parsedAmount = parseFloat(cleanedAmount);
    if (isNaN(parsedAmount)) {
        console.warn("⚠️ Amount is NaN. Defaulting to 0.0");
        parsedAmount = 0.0;
    }

    // Prepare the request data
    const reqData = {
        category: merchant,
        amount: parsedAmount,
        rewardType: rewardType
    };

    console.log("🚀 Sending request to analyze rewards:", reqData);

    // Call your new analyze_rewards endpoint via background.js (using getCardAdvice action)
    chrome.runtime.sendMessage({ action: 'getCardAdvice', data: reqData }, function(response) {
        if (response.error) {
            console.error("Error fetching reward analysis:", response.error);
            recommendationContainer.textContent = "An error occurred while fetching recommendations.";
            return;
        }

        const analysis = response.result; // Expected: { barData, explanation, recommendedCard }

        // Clear previous contents
        recommendationContainer.innerHTML = "";
        recommendationContainer.style.display = 'none'; // Temporarily hide

        // 1. Render the table inside a card
        renderTable(analysis.barData);

        // 2. Render the explanation in a separate card
        const explanationCard = document.createElement("div");
        explanationCard.classList.add("analysis-card");
        explanationCard.innerHTML = `
            <h4>Analysis Explanation:</h4>
            <p class="analysis-explanation">${analysis.explanation}</p>
            <p><strong>Recommended Card:</strong> ${analysis.recommendedCard || "None"}</p>
        `;
        recommendationContainer.appendChild(explanationCard);

        // Show the container again
        recommendationContainer.style.display = 'block';
    });
}

function renderTable(barData) {
    const container = document.getElementById('recommendation-container');
  
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("analysis-card");
  
    const table = document.createElement("table");
    table.classList.add("analysis-table");
  
    // Create header row
    const headerRow = document.createElement("tr");
  
    // Card Name (standard horizontal header)
    const cardNameTH = document.createElement("th");
    cardNameTH.textContent = "Card Name";
    headerRow.appendChild(cardNameTH);
  
    // Cashback (vertical header)
    const cashbackTH = document.createElement("th");
    cashbackTH.classList.add("vertical-header");
    cashbackTH.textContent = "Cashback (%)";
    headerRow.appendChild(cashbackTH);
  
    // Mileage (vertical header)
    const mileageTH = document.createElement("th");
    mileageTH.classList.add("vertical-header");
    mileageTH.textContent = "Mileage (%)";
    headerRow.appendChild(mileageTH);
  
    // Points (vertical header)
    const pointsTH = document.createElement("th");
    pointsTH.classList.add("vertical-header");
    pointsTH.textContent = "Points (%)";
    headerRow.appendChild(pointsTH);
  
    table.appendChild(headerRow);
  
    // Data rows
    barData.forEach(item => {
      const row = document.createElement("tr");
  
      // Card Name
      const cardCell = document.createElement("td");
      cardCell.textContent = item.cardName;
      row.appendChild(cardCell);
  
      // Cashback
      const cashbackCell = document.createElement("td");
      cashbackCell.textContent = formatValue(item.cashbackReturn);
      row.appendChild(cashbackCell);
  
      // Mileage
      const mileageCell = document.createElement("td");
      mileageCell.textContent = formatValue(item.mileageReturn);
      row.appendChild(mileageCell);
  
      // Points
      const pointsCell = document.createElement("td");
      pointsCell.textContent = formatValue(item.pointsReturn);
      row.appendChild(pointsCell);
  
      table.appendChild(row);
    });
  
    cardDiv.appendChild(table);
    container.appendChild(cardDiv);
  }
  

/**
 * Returns a string like "2.8%" or "0.0%" or "N/A" depending on the value.
 */
function formatValue(value) {
  if (value == null || isNaN(value)) {
    return "N/A";
  }
  if (value <= 0) {
    return "0.0%";
  }
  // Round to 1 decimal place
  const displayValue = (Math.round(value * 10) / 10).toFixed(1);
  return displayValue + "%";
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