import React, { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate, Link} from "react-router-dom"; 


export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
  
    async function handleLogin(e) {
      e.preventDefault();
      setError("");
  
      try {
        // loginUser returns the JSON object: { message, user: {...} }
        const data = await loginUser(email, password);
  
        // If we got here, the status was OK (200). data is e.g.: { message: "...", user: {...} }
        console.log("Logged in user:", data);
  
        // Clear form or redirect
        setEmail("");
        setPassword("");
  
        // Navigate to your dashboard
        navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Login</h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </form>

        <p className="mt-4 text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
