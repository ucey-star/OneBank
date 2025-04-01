if (!process.env.REACT_APP_API_BASE_URL) {
  throw new Error(
    "Missing REACT_APP_API_BASE_URL in the environment variables. Please set it and rebuild."
  );
}

// Use the environment variable directly
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
export async function getCardAdvice(merchant, amount, source = "extension") {
    const response = await fetch(`${BASE_URL}/api/get_card_advice`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant,
        amount,
        source
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

  export async function fetchCardBenefits(issuer, cardType) {
    const url = `${BASE_URL}/api/get_card_benefits?issuer=${encodeURIComponent(issuer)}&cardType=${encodeURIComponent(cardType)}`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch card benefits.");
    }
    const data = await response.json();
    return data; // Returns an object with the nonempty benefit sections.
  }

export async function updateCardBenefits(cardId, benefitsData) {
  const response = await fetch(`${BASE_URL}/api/update-card-benefits/${cardId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(benefitsData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update card benefits.");
  }
  return await response.json();
}
