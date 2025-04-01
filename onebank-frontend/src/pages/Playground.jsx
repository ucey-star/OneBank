import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkAuthStatus, logoutUser } from "../api/auth";
import { fetchUserCards, getCardAdvice } from "../api/credit_cards";

// Shepherd imports
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import "./styles/shepherd-custom.css"; // Optional custom overrides

export default function Playground() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendedCard, setRecommendedCard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Drag-and-drop state
  const [isOverPOS, setIsOverPOS] = useState(false);

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
      }
    }
    verifyUser();
  }, [navigate]);

  // Fetch user's cards (still needed for backend recommendations)
  useEffect(() => {
    if (isAuthed) {
      loadUserCards();
    }
    async function loadUserCards() {
      try {
        setCardsLoading(true);
        const userCards = await fetchUserCards();
        setCards(userCards);
      } catch (err) {
        console.error("Error fetching cards:", err);
      } finally {
        setCardsLoading(false);
      }
    }
  }, [isAuthed]);

  // -------------------- Shepherd.js Onboarding --------------------
  useEffect(() => {
    if (isAuthed && !localStorage.getItem("hasSeenPlaygroundTour")) {
      // Create the tour with overlay enabled
      const tour = new Shepherd.Tour({
        defaultStepOptions: {
          classes: "shepherd-theme-arrows",
          scrollTo: { behavior: "smooth", block: "center" },
        },
        useModalOverlay: true,
      });

      tour.addStep({
        id: "merchant-step",
        text: "Enter a merchant here, like 'Amazon' or 'Starbucks'.",
        attachTo: { element: "#merchant-input", on: "bottom" },
        buttons: [
          {
            text: "Next",
            action: tour.next,
          },
        ],
      });

      tour.addStep({
        id: "amount-step",
        text: "Enter the transaction amount you want to simulate.",
        attachTo: { element: "#amount-input", on: "bottom" },
        buttons: [
          {
            text: "Back",
            action: tour.back,
          },
          {
            text: "Next",
            action: tour.next,
          },
        ],
      });

      tour.addStep({
        id: "onecard-step",
        text: "This is the all-in-one OneCard you can drag onto the POS terminal to simulate a purchase.",
        attachTo: { element: "#onecard", on: "right" },
        buttons: [
          {
            text: "Back",
            action: tour.back,
          },
          {
            text: "Next",
            action: tour.next,
          },
        ],
      });

      tour.addStep({
        id: "pos-step",
        text: "Drag the OneCard into this terminal to see which real card is recommended for your transaction.",
        attachTo: { element: "#pos-terminal", on: "left" },
        buttons: [
          {
            text: "Back",
            action: tour.back,
          },
          {
            text: "Done",
            action: tour.complete,
          },
        ],
      });

      tour.start();
      localStorage.setItem("hasSeenPlaygroundTour", "true");
    }
  }, [isAuthed]);

  async function handleLogout() {
    try {
      await logoutUser(); // calls your /logout
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  }

  // Handle drag start
  function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", "generalCard");
  }

  // Handle drag over POS terminal
  function handleDragOver(e) {
    e.preventDefault();
    setIsOverPOS(true);
  }

  // Handle drag leave from POS terminal
  function handleDragLeave() {
    setIsOverPOS(false);
  }

  // Handle drop on POS terminal
  async function handleDrop(e) {
    e.preventDefault();
    setIsOverPOS(false);

    if (!merchant || !amount) {
      setErrorMessage("Please enter merchant name and amount.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setRecommendedCard(null);

    try {
      const recommendation = await getCardAdvice(merchant, amount, "playground");
      setRecommendedCard(recommendation);
    } catch (err) {
      console.error("Failed to get recommendation:", err);
      setErrorMessage(err.message || "Failed to get recommendation.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* -- Header -- */}
      <header id="header" className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            One<span className="text-blue-600">Bank</span> Playground
          </h1>
          <nav className="flex space-x-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Dashboard
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
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            Try Out our recommendations
          </h2>

          {/* Transaction Details Form */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Enter Transaction Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Merchant Name */}
              <div>
                <label
                  htmlFor="merchant"
                  className="block text-sm font-medium text-gray-700"
                >
                  Merchant Name
                </label>
                <input
                  type="text"
                  id="merchant-input"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Amazon, Starbucks"
                />
              </div>

              {/* Transaction Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Transaction Amount ($)
                </label>
                <input
                  type="number"
                  id="amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50.00"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 text-red-600">{errorMessage}</div>
            )}
          </div>

          {/* Card and POS Terminal */}
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* General Card */}
            <div className="md:w-1/2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Your All-in-One Card
              </h3>
              <div
                id="onecard"
                draggable
                onDragStart={handleDragStart}
                className="relative p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg text-white cursor-move select-none"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">OneCard</h4>
                    <p className="text-sm">All-in-One Credit Card</p>
                  </div>
                  {/* Optional: Add a logo or icon */}
                  <svg
                    className="h-8 w-8 text-white opacity-75"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.667 2.055
                      a1 1 0 00.95.69h2.29c.969 0 1.371 1.24.588 1.81l-1.852
                      1.35a1 1 0 00-.364 1.118l.667 2.055c.3.921-.755 1.688-1.538
                      1.118l-1.852-1.35a1 1 0 00-1.175 0l-1.852 1.35c-.783.57-1.838-.197-1.538-1.118l
                      .667-2.055a1 1 0 00-.364-1.118L5.455
                      7.482c-.783-.57-.38-1.81.588-1.81h2.29a1 1 0 00.95-.69l.667-2.055z"
                    />
                  </svg>
                </div>
                <div className="mt-4">
                  <p className="text-sm tracking-widest font-mono">
                    **** **** **** 1234
                  </p>
                  <p className="text-sm mt-2">Exp: 12/25</p>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Drag and drop this card onto the POS terminal to simulate a
                transaction.
              </p>
            </div>

            {/* POS Terminal */}
            <div className="md:w-1/2 mt-8 md:mt-0">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                POS Terminal
              </h3>
              <div
                id="pos-terminal"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center h-80 border-2 ${
                  isOverPOS
                    ? "border-blue-600 bg-blue-50"
                    : "border-dashed border-gray-300"
                } rounded-lg transition p-4`}
              >
                {isProcessing ? (
                  <div className="text-gray-500 animate-pulse">
                    Processing...
                  </div>
                ) : recommendedCard ? (
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Best Card to Use:
                    </h4>
                    <p className="text-blue-600 font-semibold text-xl">
                      {recommendedCard}
                    </p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="h-16 w-16 text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 48"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16h32v20H8z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 8h16v8H16z"
                      />
                    </svg>
                    <p className="text-gray-500 text-center">
                      Drag and drop your card here to see the best card to use.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clear Recommendation Button */}
          {recommendedCard && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setRecommendedCard(null);
                  setMerchant("");
                  setAmount("");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Try Another Transaction
              </button>
            </div>
          )}
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
}
