import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* -- Navbar -- */}
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Pricing</h1>
          <div className="bg-white shadow-xl rounded-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              OneBank is Free (For Now)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We believe in empowering users to maximize their credit card rewards
              without breaking the bank. Currently, OneBank is{" "}
              <strong className="text-blue-600">100% free</strong> to use.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Enjoy all our features at no cost. In the future, we may introduce
              premium plans for advanced functionalities, but for now, our goal is
              to provide everyone with the best credit card optimization solution
              possible.
            </p>

          </div>
        </div>
      </main>

      {/* -- Footer -- */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-gray-600 mb-4 sm:mb-0">
            © {new Date().getFullYear()} OneBank. All rights reserved.
          </div>
          <div className="space-x-4">
            <Link to="/privacy-policy" className="text-gray-600 hover:text-blue-600">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-gray-600 hover:text-blue-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
