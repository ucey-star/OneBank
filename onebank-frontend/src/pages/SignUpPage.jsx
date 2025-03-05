import React, { useState } from "react";
import { registerUser } from "../api/auth"; // Import your API function
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

// Regular expression for a strong password:
// - Minimum eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character.
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Compute password criteria based on the current password value
  const passwordCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[@$!%*?&]/.test(password),
  };

  // Helper function to validate form inputs
  const validateForm = () => {
    // Trim inputs to avoid spaces only
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required.");
      return false;
    }
    if (!email.trim()) {
      toast.error("Email is required.");
      return false;
    }
    // Basic email regex validation (HTML5 handles most cases, but this adds extra safety)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      toast.error("Password is required.");
      return false;
    }
    // Validate password strength using regex
    if (!strongPasswordRegex.test(password)) {
      toast.error(
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return false;
    }
    return true;
  };

  async function handleSignUp(e) {
    e.preventDefault();

    // Validate form inputs before making API call
    if (!validateForm()) {
      return;
    }

    try {
      // Call your API's registerUser function
      const data = await registerUser(firstName, lastName, email, password);

      // Assume success if no error is thrown
      toast.success(`Signup successful! Welcome, ${data.user.first_name}.`);

      // Clear the form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      navigate("/dashboard");
    } catch (err) {
      // Set an error message if the API call fails
      toast.error(err.message || "Error creating account. Please try again.");
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
              autoFocus
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>


            {/* Only show password requirements if user has started typing */}
            {password.length > 0 && (
              <ul className="mt-2 text-sm space-y-1">
                <li className={passwordCriteria.length ? "text-green-600" : "text-red-600"}>
                  {passwordCriteria.length ? "✓" : "✗"} At least 8 characters
                </li>
                <li className={passwordCriteria.uppercase ? "text-green-600" : "text-red-600"}>
                  {passwordCriteria.uppercase ? "✓" : "✗"} At least one uppercase letter
                </li>
                <li className={passwordCriteria.lowercase ? "text-green-600" : "text-red-600"}>
                  {passwordCriteria.lowercase ? "✓" : "✗"} At least one lowercase letter
                </li>
                <li className={passwordCriteria.number ? "text-green-600" : "text-red-600"}>
                  {passwordCriteria.number ? "✓" : "✗"} At least one number
                </li>
                <li className={passwordCriteria.specialChar ? "text-green-600" : "text-red-600"}>
                  {passwordCriteria.specialChar ? "✓" : "✗"} At least one special character (@$!%*?&)
                </li>
              </ul>
            )}
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
          <Link to="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
