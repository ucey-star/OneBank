import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* -- Navbar -- */}
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Terms of Service</h1>
          <div className="bg-white shadow-xl rounded-lg p-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to OneBank! By accessing or using our platform, you agree to
              be bound by these Terms of Service. Please read them carefully before
              using our services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Use of Our Services:</strong> You agree to use OneBank in
              compliance with all applicable laws and regulations. You also agree
              not to misuse our platform or distribute harmful content.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Accounts &amp; Responsibilities:</strong> You are responsible
              for maintaining the confidentiality of your account information and
              for any activities that occur under your account.
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
