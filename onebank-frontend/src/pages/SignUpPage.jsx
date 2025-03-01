import React, { useState } from "react";
import { registerUser } from "../api/auth"; // Import your API function
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");

  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const navigate = useNavigate();

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Calls your API's registerUser function
      // which should POST to /signup on your Flask backend
      const data = await registerUser(firstName, lastName, email, password);

      // If registerUser doesn’t throw, we assume success:
      setSuccess(`Signup successful! Welcome, ${data.user.first_name}.`);

      // Clear the form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      navigate("/dashboard");
    } catch (err) {
      // If registerUser throws or fails, set an error message
      setError(err.message || "Error creating account. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Sign Up</h1>

        {/* Error & Success Alerts */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSignUp}>
          {/* First Name */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">First Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 px-3 py-2 rounded"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">Last Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 px-3 py-2 rounded"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 px-3 py-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block mb-1 text-gray-700">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 px-3 py-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-gray-600 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}

