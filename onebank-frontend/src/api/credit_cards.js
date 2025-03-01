// *** Fetch the user's cards ***
export async function fetchUserCards() {
    const response = await fetch("http://127.0.0.1:5000/api/get_credit_cards", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user cards");
    }
    const data = await response.json();
    // data shape could be { cards: [ ... ], message: '...' }
    // We'll return data.cards array if present:
    return data.cards || [];
  }