import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { checkAuthStatus, logoutUser } from "../api/auth";
import { fetchUserCards, deleteUserCard } from "../api/credit_cards";
import { downloadExtension } from "../api/extension";
import { toast } from "react-toastify";
import AddCardModal from "../components/AddCardModal";
import RecommendationHistoryGraph from "../components/RecommendationHistoryGraph";
import DeleteCardModal from "../components/DeleteCardModal";
import DefaultRewardTypeSelector from "../components/DefaultRewardTypeSelector";

// Import Shepherd and its CSS
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import "./styles/shepherd-custom.css"


export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [cardToEdit, setCardToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [userFirstName, setUserFirstName] = useState("");
  const [showExtensionWarning, setShowExtensionWarning] = useState(() => {
    return !document.cookie.includes("hideExtensionWarning=true");
  });

  const handleCloseWarning = () => {
    setShowExtensionWarning(false);
    document.cookie = "hideExtensionWarning=true; path=/; max-age=" + 60 * 60 * 24 * 3;
  };


  useEffect(() => {
    async function verifyUser() {
      try {
        const data = await checkAuthStatus(); // { isLoggedIn: boolean }
        if (data.isLoggedIn) {
          setIsAuthed(true);
          setUserFirstName(data.firstName || "");
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

  useEffect(() => {
    if (isAuthed) {
      loadUserCards();
    }
  }, [isAuthed]);

  // Shepherd.js integration for first-time users
  useEffect(() => {
    if (isAuthed && !localStorage.getItem("hasSeenShepherdTour")) {
      // Create the tour with overlay enabled
      const tour = new Shepherd.Tour({
        defaultStepOptions: {
          classes: "shepherd-theme-arrows", // or your custom theme class
          scrollTo: { behavior: "smooth", block: "center" },
        },
        useModalOverlay: true, // Ensure the modal overlay is enabled
      });

      // tour.addStep({
      //   id: "header",
      //   text: "This is the header with navigation. Here you can download the extension, access the playground, or log out.",
      //   attachTo: { element: "#header", on: "bottom" },
      //   buttons: [
      //     {
      //       text: "Next",
      //       action: tour.next,
      //     },
      //   ],
      // });

      tour.addStep({
        id: "reward-selector",
        text: "This is the Default Reward Type Selector. Set your preferred reward type here.",
        attachTo: { element: "#reward-selector", on: "bottom" },
        buttons: [
          {
            text: "Next",
            action: tour.next,
          },
        ],
      });

      tour.addStep({
        id: "card-overview",
        text: "This section displays your credit cards. You can add, edit, or delete cards here.",
        attachTo: { element: "#card-overview", on: "bottom" },
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
        id: "profile-button",
        text: "Click here to view your profile.",
        attachTo: { element: "#profile-button", on: "bottom" },
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
        id: "extension-download",
        text: "Click here to download our browser extension.",
        attachTo: { element: "#extension-download", on: "bottom" },
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
        id: "playground-button",
        text: "Click here to visit the playground.",
        attachTo: { element: "#playground-button", on: "bottom" },
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
        id: "recommendation-history",
        text: "Review your recommendation history with graphs and insights here.",
        attachTo: { element: "#recommendation-history", on: "top" },
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
      localStorage.setItem("hasSeenShepherdTour", "true");
    }
  }, [isAuthed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  function promptDeleteCard(cardId) {
    setCardToDelete(cardId);
    setShowDeleteModal(true);
  }

  async function confirmDeleteCard(cardId) {
    try {
      await deleteUserCard(cardId);
      loadUserCards();
      toast.success("Card deleted successfully.");
    } catch (err) {
      console.error("Failed to delete card:", err);
      toast.error("Failed to delete card.");
    }
    setShowDeleteModal(false);
    setCardToDelete(null);
  }

  function cancelDeleteCard() {
    setShowDeleteModal(false);
    setCardToDelete(null);
  }

  async function handleLogout() {
    try {
      await logoutUser();
      toast.success("Logged out successfully.");
      navigate("/login");
    } catch (err) {
      toast.error("Failed to log out");
      console.error("Failed to log out:", err);
    }
  }

  function handleCardSaved() {
    loadUserCards();
    setIsCardModalOpen(false);
    setCardToEdit(null);
    toast.success("Card saved successfully.");
  }

  function handleEditCard(card) {
    setModalMode("edit");
    setCardToEdit(card);
    setIsCardModalOpen(true);
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {showExtensionWarning && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-3 border-b border-yellow-300 flex justify-between items-center">
            <span>
            ⚠️ A newer version of the OneBank extension is currently under review. The version live on the Chrome Web Store may contain a known bug.  
              In the meantime, you can use the most up-to-date version by downloading the ZIP file directly.  
              To verify it's live on the store, You can also use the latest deployed version here: {" "}
              <a
                href="https://chromewebstore.google.com/detail/one-bank/mcphffopiondckeljgldjknjiicdhajd?authuser=0&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-700"
              >
                View on Chrome Web Store
              </a>
            </span>
            <button
              onClick={handleCloseWarning}
              className="ml-4 text-sm font-medium text-yellow-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      {/* -- Header -- */}
      <header id="header" className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/">
            One<span className="text-blue-600">Bank</span>
          </Link>
        </h1>
          <nav className="flex space-x-6">
          <button
              id="profile-button"
              onClick={() => navigate("/profile")}
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Profile
            </button>
            <button
              id="extension-download"
              onClick={downloadExtension}
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Download Extension
            </button>
            <button
              id="playground-button"
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
      <main className="flex-grow" id="dashboard-overview">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          {userFirstName ? `Welcome back, ${userFirstName}!` : "Welcome back!"}
          </h2>

          <div id="reward-selector">
            <DefaultRewardTypeSelector />
          </div>

          {/* -- Card Overview Section -- */}
          <section id="card-overview" className="mb-10">
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
                    </div>
                    <div className="mt-4">
                      <p className="text-sm tracking-widest font-mono">
                        {card.cardNumber}
                      </p>
                    </div>
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
                        onClick={() => promptDeleteCard(card.id)}
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

          {/* -- Recommendation History Section -- */}
          <section id="recommendation-history" className="mb-10">
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

      {showDeleteModal && (
        <DeleteCardModal
          cardId={cardToDelete}
          onConfirm={confirmDeleteCard}
          onCancel={cancelDeleteCard}
        />
      )}
    </div>
  );
}
