// profile.js

if (!process.env.REACT_APP_API_BASE_URL) {
  throw new Error(
    "Missing REACT_APP_API_BASE_URL in the environment variables. Please set it and rebuild."
  );
}

// Use the environment variable directly
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function fetchProfile() {
  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      credentials: "include", // if you need to include cookies for auth
    });
    if (!response.ok) {
      throw new Error("Failed to fetch profile.");
    }
    return await response.json();
  } catch (err) {
    console.error("Error fetching profile:", err);
    throw err;
  }
}

export async function updateProfile(profileData) {
  try {
    // If you have a file to upload (like `profilePic`), you might need
    // a multipart/form-data approach. For simplicity, we assume
    // everything is JSON-serializable.
    const formData = new FormData();

    formData.append("firstName", profileData.firstName || "");
    formData.append("lastName", profileData.lastName || "");
    // If profilePic is a File object, append it; otherwise skip
    if (profileData.profilePic && profileData.profilePic instanceof File) {
      formData.append("profilePic", profileData.profilePic);
    }

    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update profile.");
    }
    return await response.json();
  } catch (err) {
    console.error("Error updating profile:", err);
    throw err;
  }
}
