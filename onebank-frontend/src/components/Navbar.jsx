import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
    const location = useLocation();
  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-800">
          One<span className="text-blue-600">Bank</span>
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
          {location.pathname !== "/login" && (
            <Link to="/login" className="mx-4 text-gray-600 hover:text-blue-600">
              Login
            </Link>
          )}
          {location.pathname !== "/signup" && (
            <Link
              to="/signup"
              className="ml-4 inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition duration-200"
            >
              Sign Up
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
