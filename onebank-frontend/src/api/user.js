if (!process.env.REACT_APP_API_BASE_URL) {
  throw new Error(
    "Missing REACT_APP_API_BASE_URL in the environment variables. Please set it and rebuild."
  );
}

// Use the environment variable directly
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Update default reward type for user
export async function updateDefaultRewardType(rewardType) {
  const response = await fetch(`${BASE_URL}/api/set_default_reward_type`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ rewardType }),
  });

  if (!response.ok) {
    throw new Error("Failed to update default reward type.");
  }

  return response.json();
}

// Fetch user's default reward type
export async function fetchDefaultRewardType() {
  const response = await fetch(`${BASE_URL}/api/get_default_reward_type`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch default reward type.");
  }

  return response.json(); // { defaultRewardType: "cashback" | "miles" | "points" }
}
