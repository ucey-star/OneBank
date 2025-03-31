import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* -- Navbar -- */}
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Features</h1>
          <div className="bg-white shadow-xl rounded-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              What OneBank Offers
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                <strong>Automated Card Selection:</strong> Let our AI guide you
                to the perfect credit card for each purchase.
              </li>
              <li>
                <strong>Real-Time Insights:</strong> Track every reward and
                benefit as you spend.
              </li>
              <li>
                <strong>Easy Setup &amp; Management:</strong> Organize your
                credit cards and benefits in one dashboard.
              </li>
            </ul>

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
