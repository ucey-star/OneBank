let isLoggedIn = false; // Cache to track the login state

document.getElementById('start-extraction').addEventListener('click', () => {
    const statusElement = document.getElementById('plugin-status');
    const formContainer = document.getElementById('form-container');
    const recommendationContainer = document.getElementById('recommendation-container');

    statusElement.textContent = 'Extracting merchant details and transaction cost...';
    formContainer.style.display = 'none';
    recommendationContainer.style.display = 'none';

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

function showEditableForm(merchant, amount) {
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = `
        <form id="edit-form">
            <label for="merchant-input">Merchant:</label><br>
            <input type="text" id="merchant-input" name="merchant" value="${merchant}"><br><br>
            <label for="amount-input">Amount:</label><br>
            <input type="text" id="amount-input" name="amount" value="${amount}"><br><br>
            <button id="submit-edits" type="button">Submit</button>
        </form>
    `;
    formContainer.style.display = 'block';

    document.getElementById('submit-edits').addEventListener('click', () => {
        const editedMerchant = document.getElementById('merchant-input').value;
        const editedAmount = document.getElementById('amount-input').value;
        handleEditedData(editedMerchant, editedAmount);
    });
}

async function handleEditedData(merchant, amount) {
    const recommendationContainer = document.getElementById('recommendation-container');
    recommendationContainer.style.display = 'block';

    if (!isLoggedIn) {
        // Revalidate login state if necessary
        try {
            const authResponse = await fetch('http://127.0.0.1:5000/status', { credentials: 'include' });
            const authStatus = await authResponse.json();

            if (authStatus.is_logged_in) {
                isLoggedIn = true; // Cache login state
            } else {
                recommendationContainer.textContent = "Please log in to view recommendations.";
                showLoginForm();
                return; // Exit early to prevent further execution
            }
        } catch (error) {
            console.error("Error checking authentication:", error);
            recommendationContainer.textContent = "An error occurred. Please try again.";
            return;
        }
    }

    // User is logged in, proceed with card advice
    try {
        const data = {
            category: merchant,
            amount: parseFloat(amount),
        };

        const cardResponse = await fetch('http://127.0.0.1:5000/api/get_card_advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const cardResult = await cardResponse.json();
        recommendationContainer.textContent = `Recommended Card: ${cardResult.recommended_card}`;
    } catch (error) {
        console.error("Error fetching card advice:", error);
        recommendationContainer.textContent = "An error occurred while fetching recommendations.";
    }
}

function showLoginForm() {
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = `
        <form id="login-form">
            <label for="email-input">Email:</label><br>
            <input type="email" id="email-input" name="email" required><br><br>
            <label for="password-input">Password:</label><br>
            <input type="password" id="password-input" name="password" required><br><br>
            <button id="login-submit" type="button">Login</button>
        </form>
    `;
    formContainer.style.display = 'block';

    document.getElementById('login-submit').addEventListener('click', async () => {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        try {
            const loginResponse = await fetch('http://127.0.0.1:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            if (loginResponse.ok) {
                const loginResult = await loginResponse.json();
                document.getElementById('plugin-status').textContent = "Logged in successfully. Welcome, " + loginResult.user.email + "!";
                formContainer.style.display = 'none';
                isLoggedIn = true; // Cache login state
            } else {
                const errorResult = await loginResponse.json();
                alert(errorResult.error || "Login failed. Please check your credentials and try again.");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("An error occurred during login. Please try again.");
        }
    });
}
