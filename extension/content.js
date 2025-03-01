// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_data") {
        try {
            extractData(sendResponse);
        } catch (error) {
            console.error("Error in extractData:", error);
            sendResponse({
                merchant_name: "Unknown",
                transaction_amount: "Unknown",
                error: error.message,
            });
        }
        return true; // Keep the message channel open for asynchronous `sendResponse`
    }
});

// Function to extract both merchant details and transaction cost
async function extractData(sendResponse) {
    try {
        const amountSelectors = [
            '.total-amount', '.price', '.amount', '.transaction-amount', '.total', '.sum', '.grand-total'
        ];
        const amountRegex = /(\$|£|€|¥|₹|₩|₽|฿|₫|₱|₪|₭|₦|₨)\s?\d{1,3}(?:[,.']\d{3})*(?:[,.]\d{2})?/g;

        let transactionAmount = getTextFromSelectors(amountSelectors);
        const pageText = document.body.innerText;

        // Fallback to regex for amount
        if (!transactionAmount || transactionAmount === 'Unknown') {
            const amounts = pageText.match(amountRegex);
            if (amounts && amounts.length === 1) {
                transactionAmount = amounts[0];
            } else if (amounts && amounts.length > 1) {
                transactionAmount = findTotalAmount(pageText, amounts);
            } else {
                transactionAmount = 'Unknown';
            }
        }

        // Use domain name as the merchant name
        const merchantName = getDomainName(window.location.hostname);

        console.log("Extracted Data:", { merchantName, transactionAmount });

        // Send the extracted data back
        sendResponse({
            merchant_name: merchantName || 'Unknown',
            transaction_amount: transactionAmount || 'Unknown',
        });
    } catch (error) {
        console.error('Error extracting data:', error);
        sendResponse({
            merchant_name: 'Unknown',
            transaction_amount: 'Unknown',
            error: error.message,
        });
    }
}

// Helper function to get text from specified selectors
function getTextFromSelectors(selectors) {
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.innerText?.trim();
            if (text) {
                return text;
            }
        }
    }
    return null;
}

// Function to extract the domain name
function getDomainName(hostname) {
    let domain = hostname.toLowerCase().replace(/^www\./, '');
    const parts = domain.split('.');
    if (parts.length > 2) {
        const tld = parts[parts.length - 1];
        const sld = parts[parts.length - 2];
        const ccTLDs = ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac'];
        if (ccTLDs.includes(sld)) {
            domain = parts.slice(-3).join('.');
        } else {
            domain = parts.slice(-2).join('.');
        }
    } else {
        domain = parts.join('.');
    }
    const domainParts = domain.split('.');
    return domainParts.length >= 2
        ? domainParts[domainParts.length - 2].charAt(0).toUpperCase() + domainParts[domainParts.length - 2].slice(1)
        : domain;
}

// Function to find the total amount from multiple matches
function findTotalAmount(pageText, amounts) {
    const lines = pageText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/total amount|amount due|grand total|order total|total|balance due|sum/i.test(line)) {
            for (let j = i; j <= i + 2 && j < lines.length; j++) {
                const amountMatch = lines[j].match(/(\$|£|€|¥|₹|₩|₽|฿|₫|₱|₪|₭|₦|₨)\s?\d{1,3}(?:[,.']\d{3})*(?:[,.]\d{2})?/);
                if (amountMatch) {
                    return amountMatch[0];
                }
            }
        }
    }
    return amounts.sort((a, b) => parseFloat(b.replace(/[^0-9.]+/g, '')) - parseFloat(a.replace(/[^0-9.]+/g, '')))[0];
}
