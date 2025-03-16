import React, { useState, useEffect } from "react";
import { updateDefaultRewardType, fetchDefaultRewardType } from "../api/user";
import { toast } from "react-toastify";

const rewardTypes = ["cashback", "miles", "points"];

export default function DefaultRewardTypeSelector() {
  const [defaultRewardType, setDefaultRewardType] = useState("cashback");

  useEffect(() => {
    const loadDefaultRewardType = async () => {
      try {
        const { defaultRewardType } = await fetchDefaultRewardType();
        setDefaultRewardType(defaultRewardType);
      } catch (error) {
        console.error("Error loading default reward type:", error);
        toast.error("Unable to load default reward type.");
      }
    };

    loadDefaultRewardType();
  }, []);

  const handleRewardTypeChange = async (event) => {
    const selectedType = event.target.value;
    setDefaultRewardType(selectedType);

    try {
      await updateDefaultRewardType(selectedType);
      toast.success("Default reward type updated successfully.");
    } catch (error) {
      console.error("Error updating default reward type:", error);
      toast.error("Failed to update reward type.");
    }
  };

  return (
    <div className="mt-6 mb-4 bg-white shadow rounded-xl px-6 py-4">
      <label htmlFor="rewardType" className="block text-lg font-semibold text-gray-700">
        Default Reward Type
      </label>
      <select
        id="rewardType"
        value={defaultRewardType}
        onChange={handleRewardTypeChange}
        className="mt-2 block w-full border border-gray-200 bg-gray-100 text-gray-800 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out"
      >
        {rewardTypes.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}