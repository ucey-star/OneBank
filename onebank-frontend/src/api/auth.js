// src/api/auth.js

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000"; // Default to localhost if env variable is missing
// const BASE_URL ="http://127.0.0.1:5000"; 

export async function loginUser(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  }
  

export async function registerUser(firstName, lastName, email, password) {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // If you need session cookies set
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
      }),
    });
  
    if (!response.ok) {
      // The backend returns a 409 if the email is already in use
      throw new Error("Signup failed. Email might already exist.");
    }
  
    // If 201 Created or another success code, parse JSON response
    const data = await response.json();
    return data;
  }
  
// Check if user is authenticated
export async function checkAuthStatus() {
    const response = await fetch(`${BASE_URL}/status`, {
      credentials: "include",
    });
  
    if (!response.ok) {
      // Possibly a 500 or some unexpected error
      throw new Error("Failed to check auth status");
    }
  
    // Expecting { isLoggedIn: true } or false
    const data = await response.json();
    return data; // e.g. { isLoggedIn: true/false }
  }
  
  // Log out the user
  export async function logoutUser() {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to log out");
    }
    return response.json(); 
  }