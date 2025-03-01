import React, { useState, useEffect } from "react";
import { addUserCard, updateUserCard, fetchCardOptions } from "../api/credit_cards";

export default function AddCardModal({ onClose, onCardSaved, card = null, mode = "add" }) {
  const [issuer, setIssuer] = useState(card?.issuer || "");
  const [cardType, setCardType] = useState(card?.cardType || "");
  const [cardHolderName, setCardHolderName] = useState(card?.cardHolderName || "");
  const [cardNumber, setCardNumber] = useState(card?.cardNumber || "");
  const [expiryDate, setExpiryDate] = useState(card?.expiryDate || "");
  const [cvv, setCvv] = useState(card?.cvv || ""); // Typically not editable in edit mode

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // State to hold issuers and card types
  const [cardOptions, setCardOptions] = useState({});
  const [cardTypeOptions, setCardTypeOptions] = useState([]);

  // Fetch card options when the component mounts
  useEffect(() => {
    async function getCardOptions() {
      try {
        const options = await fetchCardOptions();
        setCardOptions(options);
      } catch (err) {
        console.error("Failed to fetch card options:", err);
        setErrorMessage("Failed to load card options. Please try again.");
      }
    }
    getCardOptions();
  }, []);

  // Update card type options when issuer changes
  useEffect(() => {
    if (issuer && cardOptions[issuer]) {
      setCardTypeOptions(cardOptions[issuer]);
    } else {
      setCardTypeOptions([]);
    }
  }, [issuer, cardOptions]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Create card data object
      const cardData = {
        issuer,
        cardType,
        cardHolderName,
        cardNumber,
        expiryDate,
        cvv,
      };

      if (mode === "edit") {
        // Exclude fields that shouldn't be updated
        delete cardData.cardNumber;
        delete cardData.cvv;

        // Call API to update the card
        await updateUserCard(card.id, cardData);
      } else {
        // Call API to add the card
        await addUserCard(cardData);
      }

      // Inform parent component that the card was saved
      onCardSaved();
      // Close the modal
      onClose();
    } catch (err) {
      console.error("Failed to save card:", err);
      setErrorMessage(err.message || "An error occurred while saving the card.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {mode === "edit" ? "Edit Card" : "Add New Card"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {errorMessage && <div className="mb-4 text-red-600">{errorMessage}</div>}

          {/* Issuer */}
          <div className="mb-4">
            <label htmlFor="issuer" className="block text-sm font-medium text-gray-700">
              Issuer
            </label>
            <select
              id="issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            >
              <option value="" disabled>
                Select an issuer
              </option>
              {Object.keys(cardOptions).map((issuerName) => (
                <option key={issuerName} value={issuerName}>
                  {issuerName}
                </option>
              ))}
            </select>
          </div>

          {/* Card Type */}
          <div className="mb-4">
            <label htmlFor="cardType" className="block text-sm font-medium text-gray-700">
              Card Type
            </label>
            <select
              id="cardType"
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              required
              disabled={!issuer}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white disabled:bg-gray-100"
            >
              <option value="" disabled>
                {issuer ? "Select a card type" : "Select an issuer first"}
              </option>
              {cardTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Card Holder Name */}
          <div className="mb-4">
            <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700">
              Card Holder Name
            </label>
            <input
              type="text"
              id="cardHolderName"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Name as on card"
            />
          </div>

          {/* Card Number (only in add mode) */}
          {mode === "add" && (
            <>
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  maxLength={16}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="16-digit card number"
                />
              </div>

              {/* CVV */}
              <div className="mb-4">
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                  maxLength={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="3 or 4-digit CVV"
                />
              </div>
            </>
          )}

          {/* Expiry Date */}
          <div className="mb-6">
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
              Expiry Date
            </label>
            <input
              type="month"
              id="expiryDate"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {isSubmitting
                ? mode === "edit"
                  ? "Updating..."
                  : "Adding..."
                : mode === "edit"
                ? "Update Card"
                : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}