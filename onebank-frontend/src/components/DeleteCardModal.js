// DeleteCardModal.js
import React from "react";
import { createPortal } from "react-dom";
import { FaExclamationTriangle } from "react-icons/fa";

export default function DeleteCardModal({ cardId, onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 transform transition-all">
        <div className="flex items-center space-x-3 mb-4">
          <FaExclamationTriangle className="text-red-600 text-2xl" />
          <h3 className="text-2xl font-bold text-gray-800">Confirm Deletion</h3>
        </div>
        <p className="text-gray-600 mb-8">
          Are you sure you want to delete this card? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => onConfirm(cardId)}
            className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
