// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_data") {
        const domContent = document.body.outerHTML; // Get the entire DOM content
        extractData(domContent, sendResponse); // Pass `sendResponse` to handle the combined extraction
        return true; // Keeps the message channel open for asynchronous `sendResponse`
    }
});

// Function to extract both merchant details and transaction cost
function extractData(domContent, sendResponse) {
    const BATCH_SIZE = 500; // Number of elements per batch
    const domElements = domContent.split(/\s+/); // Split by whitespace or elements
    const totalBatches = Math.ceil(domElements.length / BATCH_SIZE);
    let currentBatch = 0;

    // Variables to store extracted details
    let merchantName = null;
    let transactionAmount = null;

    function sendBatch() {
        if (currentBatch >= totalBatches) {
            // If no more batches and details not found, fallback to manual input
            sendResponse({
                merchant_name: merchantName || "Unknown",
                transaction_amount: transactionAmount || "Unknown"
            });
            return;
        }

        const batch = domElements.slice(
            currentBatch * BATCH_SIZE,
            (currentBatch + 1) * BATCH_SIZE
        );
        currentBatch++;

        // Send the batch to the server
        fetch('http://127.0.0.1:5000/api/analyze_dom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html: batch.join(' ') }),
        })
            .then((response) => response.json())
            .then((data) => {
                // Update merchant name or transaction amount if found
                if (data.merchant_name && data.merchant_name !== 'Unknown') {
                    merchantName = data.merchant_name;
                }
                if (data.transaction_amount && data.transaction_amount !== 'Unknown') {
                    transactionAmount = data.transaction_amount;
                }

                // If either detail is found, send the response immediately
                if (merchantName || transactionAmount) {
                    sendResponse({
                        merchant_name: merchantName || "Unknown",
                        transaction_amount: transactionAmount || "Unknown"
                    });
                } else {
                    sendBatch(); // Continue to the next batch
                }
            })
            .catch((error) => {
                console.error('Error analyzing batch:', error);
                sendResponse({
                    merchant_name: merchantName || "Unknown",
                    transaction_amount: transactionAmount || "Unknown"
                }); // Final response on error
            });
    }

    sendBatch(); // Start processing batches
}
