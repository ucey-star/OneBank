import React, { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc"; // Google icon
import Navbar from "../components/Navbar";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      toast.success("Log in successful");
      setEmail("");
      setPassword("");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Invalid email or password");
    }
  }

  function handleGoogleLogin() {
    // Notice the "?react=1" at the end
    const googleLoginURL = `${
      process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000"
    }/login/google?react=1`;
  
    const width = 600,
      height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const popup = window.open(
      googleLoginURL,
      "GoogleLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  
    if (!popup) {
      toast.error("Popup blocked. Please allow popups for this website.");
      return;
    }
  
    // Listen for postMessage from the popup
    const messageListener = (event) => {
      // Optionally validate event.origin
      const { success, user, message } = event.data;
      if (success) {
        toast.success(message);
        // e.g. store user in context or state
        navigate("/dashboard");
      } else {
        toast.error("Google login failed");
      }
      window.removeEventListener("message", messageListener);
    };
  
    window.addEventListener("message", messageListener, false);
  }
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 shadow-md rounded">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Login</h1>

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field with Toggle */}
            <div className="mb-6">
              <label htmlFor="password" className="block mb-1 text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
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
            </div>

            {/* Submit Button for Email/Password Login */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Log In
            </button>
          </form>

          {/* Divider with "OR" */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-2 text-gray-500">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          {/* Google Sign-In Button */}
          <div className="mt-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-800 py-2 rounded hover:bg-gray-100 transition"
            >
              <FcGoogle className="inline-block mr-2" size={24} />
              Sign In with Google
            </button>
          </div>

          <p className="mt-4 text-gray-600 text-sm">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
