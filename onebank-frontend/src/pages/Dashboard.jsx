import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkAuthStatus,
  logoutUser
} from "../api/auth";
import { fetchUserCards } from "../api/credit_cards";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);

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

  // Once user is authed, fetch their credit cards
  useEffect(() => {
    if (isAuthed) {
      loadUserCards();
    }
    async function loadUserCards() {
      try {
        setCardsLoading(true);
        const userCards = await fetchUserCards(); // e.g. returns [{...}, {...}]
        setCards(userCards);
      } catch (err) {
        console.error("Error fetching cards:", err);
      } finally {
        setCardsLoading(false);
      }
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
                onClick={() => navigate("/add-card")} // or open a modal, etc.
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
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className="relative p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg text-white"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {card.issuer}
                        </h4>
                        <p className="text-sm">{card.cardType}</p>
                      </div>
                      <img
                        src={`/images/card-logos/${card.issuer.toLowerCase()}.png`}
                        alt={`${card.issuer} logo`}
                        className="h-8 w-auto"
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm tracking-widest font-mono">
                        **** **** **** {card.cardNumber.slice(-4)}
                      </p>
                      <p className="text-sm mt-2">
                        Exp: {card.expiryDate}
                      </p>
                    </div>
                    <div className="absolute top-4 right-4">
                      {/* Perhaps an icon button to edit or remove the card */}
                      <button className="text-white hover:text-gray-200">
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
                            d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
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
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Recommendation History
            </h3>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-6">
                Track and visualize your recommended cards over time.
              </p>
              <div className="h-64 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                {/* Chart placeholder */}
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h4a1 1 0 011 1v6H2v-6zm6-8a1 1 0 011-1h4a1 1 0 011 1v14h-6V3zm8 4a1 1 0 011-1h4a1 1 0 011 1v10h-6V7z" />
                </svg>
              </div>
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
}