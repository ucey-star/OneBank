const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000"; // Default to localhost if env variable is missing
// const BASE_URL ="http://127.0.0.1:5000"; 

  // *** Add a user's credit card ***
export async function addUserCard(cardData) {
    const response = await fetch(`${BASE_URL}/api/add-credit-card`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Failed to add card.";
      throw new Error(errorMessage);
    }
  
    const data = await response.json();
    // data shape: { message: '...', card: { ... } }
    return data.card;
  }
  
  // *** Fetch the user's cards ***
  export async function fetchUserCards() {
    const response = await fetch(`${BASE_URL}/api/get_credit_cards`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user cards");
    }
    const data = await response.json();
    // data shape: { cards: [ ... ], message: '...' }
    // We'll return data.cards array if present:
    return data.cards || [];
  }

  // Function to fetch issuers and card types
export async function fetchCardOptions() {
    const response = await fetch(`${BASE_URL}/api/get_card_options`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch card options");
    }
    const data = await response.json();
    // Data format: { 'Issuer1': ['CardType1', 'CardType2'], 'Issuer2': [ ... ] }
    return data;
  }
  

// Function to update a user's card
export async function updateUserCard(cardId, cardData) {
    const response = await fetch(`${BASE_URL}/api/update-credit-card/${cardId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Failed to update card.";
      throw new Error(errorMessage);
    }
  
    const data = await response.json();
    return data;
  }

  // Function to delete a user's card
export async function deleteUserCard(cardId) {
    const response = await fetch(`${BASE_URL}/api/delete_card/${cardId}`, {
      method: "DELETE",
      credentials: "include",
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Failed to delete card.";
      throw new Error(errorMessage);
    }
  
    const data = await response.json();
    return data;
  }

  // Function to get card advice
export async function getCardAdvice(merchant, amount) {
    const response = await fetch(`${BASE_URL}/api/get_card_advice`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant,
        amount,
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Failed to get card advice.";
      throw new Error(errorMessage);
    }
  
    const data = await response.json();
    return data.recommended_card; // Assuming the backend returns { recommended_card: "..." }
  }