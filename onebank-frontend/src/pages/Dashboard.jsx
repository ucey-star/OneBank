import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkAuthStatus,
  logoutUser,
} from "../api/auth";
import {
  fetchUserCards,
  deleteUserCard,    // Import the delete function
} from "../api/credit_cards";
import { downloadExtension } from "../api/extension";
import AddCardModal from "../components/AddCardModal"; // Import the AddCardModal component
import RecommendationHistoryGraph from "../components/RecommendationHistoryGraph";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [cardToEdit, setCardToEdit] = useState(null);
  

  useEffect(() => {
    async function verifyUser() {
      try {
        const data = await checkAuthStatus(); // { isLoggedIn: boolean }
        if (data.isLoggedIn) {
          setIsAuthed(true);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Failed to check auth status:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }
    verifyUser();
  }, [navigate]);

  // Define loadUserCards outside of useEffect to call it from elsewhere
  async function loadUserCards() {
    try {
      setCardsLoading(true);
      const userCards = await fetchUserCards(); // e.g., returns [{...}, {...}]
      setCards(userCards);
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setCardsLoading(false);
    }
  }

  // Once user is authed, fetch their credit cards
  useEffect(() => {
    if (isAuthed) {
      loadUserCards();
    }
  }, [isAuthed]);

  // During initial auth check
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Checking authentication...
      </div>
    );
  }

  // If auth fails, we redirect, so no need to render
  if (!isAuthed) {
    return null;
  }

  // --- Dashboard Layout ---
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* -- Header -- */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            One<span className="text-blue-600">Bank</span>
          </h1>
          <nav className="flex space-x-6">
          <button
              onClick={downloadExtension}
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Download Extension
            </button>
            <button
              onClick={() => navigate("/playground")}
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Playground
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Log Out
            </button>
          </nav>
        </div>
      </header>

      {/* -- Main Content -- */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            Welcome back!
          </h2>

          {/* -- Card Overview Section -- */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Your Credit Cards
              </h3>
              <button
                onClick={() => {
                  setModalMode("add");
                  setCardToEdit(null);
                  setIsCardModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow hover:bg-blue-700 transition"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                Add Card
              </button>
            </div>

            {cardsLoading ? (
              <div className="text-gray-500">Loading cards...</div>
            ) : cards.length === 0 ? (
              <div className="text-gray-500">No cards found.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="relative p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg text-white"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {card.issuer}
                        </h4>
                        <p className="text-sm">{card.cardType}</p>
                      </div>
                      {/* Optional: Include issuer logo if available */}
                      {/* <img
                        src={`/images/card-logos/${card.issuer.toLowerCase()}.png`}
                        alt={`${card.issuer} logo`}
                        className="h-8 w-auto"
                      /> */}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm tracking-widest font-mono">
                        {card.cardNumber}
                      </p>
                      <p className="text-sm mt-2">
                        Exp: {card.expiryDate}
                      </p>
                    </div>
                    {/* Actions: Edit and Delete */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="text-white hover:text-gray-200"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536M9 11l6 6M9 11l-3-3m6 6l-3-3"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-white hover:text-gray-200"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* -- Recommendation History Section (Placeholder) -- */}
          <section className="mb-10">
            <div className="bg-white rounded-lg shadow p-6">
              <RecommendationHistoryGraph />
            </div>

          </section>
        </div>
      </main>

      {/* -- Footer -- */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-gray-500">
          © {new Date().getFullYear()} OneBank. All rights reserved.
        </div>
      </footer>

      {/* -- Add/Edit Card Modal -- */}
      {isCardModalOpen && (
        <AddCardModal
          onClose={() => setIsCardModalOpen(false)}
          onCardSaved={handleCardSaved}
          card={cardToEdit}
          mode={modalMode}
        />
      )}
    </div>
  );

  // -- Functions --

  async function handleLogout() {
    try {
      await logoutUser(); // calls your /logout
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  }

  function handleCardSaved() {
    // Re-fetch the cards from the server for consistency
    loadUserCards();
    setIsCardModalOpen(false);
    setCardToEdit(null);
  }

  function handleEditCard(card) {
    setModalMode("edit");
    setCardToEdit(card);
    setIsCardModalOpen(true);
  }

  async function handleDeleteCard(cardId) {
    if (window.confirm("Are you sure you want to delete this card?")) {
      try {
        await deleteUserCard(cardId);
        loadUserCards();
      } catch (err) {
        console.error("Failed to delete card:", err);
        // Optionally, display an error message to the user
      }
    }
  }
}