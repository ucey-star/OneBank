import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* -- Navbar -- */}
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          <div className="bg-white shadow-xl rounded-lg p-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              At OneBank, we are committed to safeguarding the privacy of our
              users. This Privacy Policy describes how we collect, use, and
              protect your personal information when you use our services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using OneBank, you agree to this Policy. Please read
              it carefully, and if you have any questions, feel free to contact us.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Information We Collect:</strong> We may collect your name,
              email address, transaction details, and any other information you
              provide to personalize your experience.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>How We Use Your Information:</strong> We utilize your data
              to improve your user experience, recommend optimal credit card usage,
              and provide customer support.
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
