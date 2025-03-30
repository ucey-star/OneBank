import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { fetchProfile, updateProfile } from "../api/profile";
import { fetchUserCards, fetchCardBenefits, updateCardBenefits } from "../api/credit_cards";

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

/**
 * Derives a valid image URL for the profile picture.
 * - If `profilePic` is a File, returns a local preview URL.
 * - If it's a string (e.g., a data URI), returns it directly.
 * - Otherwise, returns an empty string.
 */
function getProfilePicSrc(profilePic) {
  if (!profilePic) return "";
  if (profilePic instanceof File) return URL.createObjectURL(profilePic);
  if (typeof profilePic === "string") return profilePic;
  return "";
}

/* -------------------------------------------------------------------------- */
/*                           Sub-Components (UI)                              */
/* -------------------------------------------------------------------------- */

/** 
 * Displays and manages the user’s profile section: 
 *   - Profile picture
 *   - Name fields
 *   - Save button
 */
function ProfileSection({
  profile,
  onChangeProfile,
  onChangeFile,
  onSubmitProfile,
  isSaving,
}) {
  const imgSrc = getProfilePicSrc(profile.profilePic);

  return (
    <section className="bg-white shadow-xl rounded-2xl p-8 mb-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h2>

      {/* Picture */}
      <div className="flex flex-col items-center">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Profile"
            className="h-28 w-28 object-cover rounded-full border-4 border-white shadow-md"
          />
        ) : (
          <div className="relative h-28 w-28 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 5-2.3 5-5S14.7 2 12 2 7 4.3 7 7s2.3 5 5 5zm-7 8c0-3.9 3.1-7 7-7s7 3.1 7 7v1H5v-1z" />
            </svg>
          </div>
        )}

        {/* Picture Upload */}
        <label className="mt-4 text-sm font-medium text-gray-700">
          Change Profile Picture
        </label>
        <input
          type="file"
          onChange={onChangeFile}
          className="mt-2 text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
                     file:rounded file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                     focus:outline-none cursor-pointer"
        />
      </div>

      {/* Name Fields */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={profile.firstName}
            onChange={onChangeProfile}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2
                       focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your first name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={profile.lastName}
            onChange={onChangeProfile}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2
                       focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your last name"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-center sm:justify-end">
        <button
          onClick={onSubmitProfile}
          disabled={isSaving}
          className={`inline-flex items-center px-5 py-2 rounded-full text-white 
                      font-medium shadow-md transform transition-all duration-300 
                      ${
                        isSaving
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-blue-500`}
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </section>
  );
}

/** 
 * Renders a single Card item along with any associated benefits. 
 *   - Social benefits input
 *   - Save benefits button
 *   - Detailed benefits (if available)
 */
function CardItem({
  card,
  socialBenefitText,
  onChangeSocialBenefit,
  onSubmitBenefits,
  existingBenefits,
  onEdit,
  onDelete,
  editingCardId,
  cardBenefits,
}) {
  const isEditing = editingCardId === card.id;
  const hasSaved = !!existingBenefits[card.id];

  return (
    <div className="mb-8 p-6 border border-gray-200 bg-white rounded-xl">
      <h3 className="font-semibold text-lg text-gray-700">
        {card.issuer} - {card.cardType}
      </h3>

      {/* Always show default card benefits */}
      {cardBenefits && (
        <div className="mt-5 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Card Benefits</h4>
          {Object.entries(cardBenefits).map(([section, details]) => (
            <div key={section} className="mb-4">
              <h5 className="font-medium capitalize mb-1">
                {section.replace("_", " ")}
              </h5>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Conditional: Show socialized benefits OR input form */}
      <div className="mt-6">
        {hasSaved && !isEditing ? (
          <div className="bg-blue-50 p-4 rounded-md border text-gray-800">
            <h4 className="font-semibold text-sm mb-2 text-blue-700">
              Socialized Benefit
            </h4>
            <p className="text-sm">{existingBenefits[card.id]}</p>
            <div className="mt-2 space-x-4">
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => onEdit(card.id)}
              >
                Edit
              </button>
              <button
                className="text-red-600 hover:underline text-sm"
                onClick={() => onDelete(card.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700">
              {hasSaved ? "Edit Socialized Benefit:" : "Add Socialized Benefits:"}
            </label>
            <textarea
              value={socialBenefitText}
              onChange={(e) => onChangeSocialBenefit(card.id, e.target.value)}
              placeholder="E.g., This card helps me earn more travel points..."
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
            />
            <button
              onClick={() => onSubmitBenefits(card.id)}
              className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-green-600 text-white text-sm hover:bg-green-700"
            >
              Save Benefits
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */

export default function ProfilePage() {
  const navigate = useNavigate();

  // ------------------------- State -------------------------
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    profilePic: "",
  });

  const [cards, setCards] = useState([]);
  const [socialBenefits, setSocialBenefits] = useState({});
  const [cardBenefits, setCardBenefits] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingBenefits, setExistingBenefits] = useState({});
  const [editingCardId, setEditingCardId] = useState(null);


  // ------------------------ Effects ------------------------
  useEffect(() => {
    // Load initial data: user profile and credit cards
    async function loadData() {
      try {
        const profileData = await fetchProfile();
        setProfile(profileData);

        const cardsData = await fetchUserCards();
        setCards(cardsData);
        const benefitsMap = {};
        cardsData.forEach((card) => {
          if (card.socialized_benefits) {
            benefitsMap[card.id] = card.socialized_benefits;
          }
        });
        setExistingBenefits(benefitsMap);
      } catch (error) {
        console.error("Error loading profile/cards:", error);
        toast.error("Failed to load profile information.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    // Once cards are loaded, fetch benefits for each
    async function loadBenefits() {
      const benefitsMap = {};

      await Promise.all(
        cards.map(async (card) => {
          try {
            const benefits = await fetchCardBenefits(card.issuer, card.cardType);
            if (benefits && Object.keys(benefits).length > 0) {
              benefitsMap[card.id] = benefits;
            }
          } catch (error) {
            console.error(`Error fetching benefits for card ${card.id}:`, error);
          }
        })
      );

      setCardBenefits(benefitsMap);
    }

    if (cards.length > 0) {
      loadBenefits();
    }
  }, [cards]);

  // ---------------------- Handlers -------------------------
  // Profile updates
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (cardId) => {
    setEditingCardId(cardId);
    setSocialBenefits((prev) => ({
      ...prev,
      [cardId]: existingBenefits[cardId] || "",
    }));
  };
  
  const handleDelete = async (cardId) => {
    try {
      await updateCardBenefits(cardId, { benefits: "" });
      toast.success("Benefits deleted.");
      setExistingBenefits((prev) => {
        const updated = { ...prev };
        delete updated[cardId];
        return updated;
      });
      setSocialBenefits((prev) => {
        const updated = { ...prev };
        delete updated[cardId];
        return updated;
      });
      setEditingCardId(null);
    } catch (err) {
      toast.error("Failed to delete benefit.");
    }
  };
  
  const handleSubmitBenefits = async (cardId) => {
    try {
      await updateCardBenefits(cardId, { benefits: socialBenefits[cardId] });
      toast.success("Benefits saved.");
      setExistingBenefits((prev) => ({
        ...prev,
        [cardId]: socialBenefits[cardId],
      }));
      setEditingCardId(null);
      // window.location.reload(); // Reload the page after saving
    } catch (err) {
      toast.error("Failed to save benefits.");
    }
  };
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({ ...prev, profilePic: file }));
    }
  };

  const handleSubmitProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Benefits updates
  const handleSocialBenefitsChange = (cardId, benefitsText) => {
    setSocialBenefits((prev) => ({ ...prev, [cardId]: benefitsText }));
  };




  // ---------------------- Render ---------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 py-8">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            One<span className="text-blue-600">Bank</span> Profile
          </h1>
          <nav className="flex space-x-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-150"
            >
              Dashboard
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Profile Section */}
        <ProfileSection
          profile={profile}
          onChangeProfile={handleProfileChange}
          onChangeFile={handleFileChange}
          onSubmitProfile={handleSubmitProfile}
          isSaving={saving}
        />

        {/* Cards & Benefits Section */}
        <section className="bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            My Cards &amp; Benefits
          </h2>
          {cards.length === 0 ? (
            <p className="text-gray-600">No cards found.</p>
          ) : (
            cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                socialBenefitText={socialBenefits[card.id] || ""}
                onChangeSocialBenefit={handleSocialBenefitsChange}
                onSubmitBenefits={handleSubmitBenefits}
                existingBenefits={existingBenefits}
                onEdit={handleEdit}
                onDelete={handleDelete}
                editingCardId={editingCardId}
                cardBenefits={cardBenefits[card.id]}
              />
            ))            
          )}
        </section>
      </div>
    </div>
  );
}
