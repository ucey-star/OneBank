import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HowItWorks from "../components/HowItWorks";


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* -- Navbar -- */}
      <Navbar />

      {/* -- Hero Section -- */}
      <section className="flex-grow bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="md:w-2/3">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Optimize Every Credit Card Transaction with{" "}
              <span className="text-yellow-300">One Bank</span>
            </h1>
            <p className="mb-8 text-lg sm:text-xl text-gray-100">
              A single platform to help you maximize rewards and minimize costs.
              Smarter credit card recommendations – automatically.
            </p>
            <Link
              to="/signup"
              className="inline-block bg-yellow-300 text-gray-800 px-6 py-3 rounded font-semibold hover:bg-yellow-400 transition duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* -- Features Section -- */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">
            Why One Bank?
          </h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="mb-4">
                {/* Example icon: replace with your own image/SVG */}
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.6 4.99
                      a1.062 1.062 0 001.011.73h5.248c.96 0 1.36 1.25.588
                      1.81l-4.243 3.086a1.06 1.06 0 00-.384
                      1.184l1.618 5.038c.303.946-.755
                      1.686-1.54 1.168l-4.355-2.923a1.065 1.065
                      0 00-1.154 0l-4.355 2.923c-.784.518-1.843-.222-1.54-1.168l
                      1.618-5.038a1.06 1.06 0 00-.384-1.184L2.602
                      9.457c-.772-.56-.372-1.81.588-1.81h5.248a1.062
                      1.062 0 001.011-.73l1.6-4.99z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Automated Card Selection
              </h3>
              <p className="text-gray-600">
                Our AI-driven engine suggests the best credit card for every
                purchase, ensuring you never miss valuable rewards.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c.414 0
                      .75.336.75.75V12h2.25a.75.75 0 010
                      1.5H12.75A.75.75 0 0112 12.75v-3c0-.414.336-.75.75-.75z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2.25c5.385
                      0 9.75 4.365 9.75
                      9.75s-4.365 9.75-9.75
                      9.75-9.75-4.365-9.75-9.75S6.615
                      2.25 12 2.25z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Real-Time Insights
              </h3>
              <p className="text-gray-600">
                See how much you’re saving on every transaction and track your
                total rewards in an easy-to-use dashboard.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 9h16.5M3.75
                      15.75h16.5"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Simple &amp; Secure
              </h3>
              <p className="text-gray-600">
                Your financial data is encrypted and never shared. Security is
                our top priority so you can optimize with peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>
      <HowItWorks />

      {/* -- Call to Action Section -- */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Maximize Your Rewards?
          </h2>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
            One Bank makes smart credit card selection effortless. Join our
            community of savvy savers who’ve already unlocked more benefits.
          </p>
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded shadow hover:bg-blue-700 transition duration-200"
          >
            Get Started
          </Link>
        </div>
      </section>

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
