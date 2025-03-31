import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { checkAuthStatus } from "../api/auth";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await checkAuthStatus(); // e.g. { isLoggedIn: true }
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        setIsLoggedIn(false);
      }
    })();
  }, []);

  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Clickable "OneBank" -> Home */}
        <div className="text-2xl font-bold text-gray-800">
          <Link to="/" className="hover:text-blue-600">
            One<span className="text-blue-600">Bank</span>
          </Link>
        </div>

        <div>
          <Link to="/" className="mx-4 text-gray-600 hover:text-blue-600">
            Home
          </Link>
          <Link to="/features" className="mx-4 text-gray-600 hover:text-blue-600">
            Features
          </Link>
          <Link to="/pricing" className="mx-4 text-gray-600 hover:text-blue-600">
            Pricing
          </Link>

          {/* If user is logged in, show Dashboard; otherwise show Login + Sign Up */}
          {isLoggedIn ? (
            <Link to="/dashboard" className="mx-4 text-gray-600 hover:text-blue-600">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="mx-4 text-gray-600 hover:text-blue-600">
                Login
              </Link>
              <Link
                to="/signup"
                className="ml-4 inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
