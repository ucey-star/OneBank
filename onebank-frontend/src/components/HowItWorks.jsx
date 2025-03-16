import React, { useState, useEffect, useRef } from "react";

// Define all your steps in one array
const stepsData = [
  {
    number: 1,
    title: "Sign Up and Log In",
    description:
      "Create an account or log in if you already have one. This is the first step to accessing all of OneBank’s features.",
  },
  {
    number: 2,
    title: "Go to Your Dashboard",
    description:
      "Once logged in, head over to your dashboard where you’ll find all your personalized tools and recommendations.",
  },
  {
    number: 3,
    title: "Add Your Card",
    description:
      "Add your card details. Note that we only save the issuer, card type, and the card holder name. We do not collect sensitive information like your card number or CVV.",
  },
  {
    number: 4,
    title: "Download and Set Up the Extension",
    description:
      "Download our browser extension and follow the setup instructions.",
  },
  {
    number: 5,
    title: "Use the Extension",
    description:
      "Sign in with your OneBank credentials. The extension extracts the merchant and transaction details automatically. Correct any inaccuracies and choose to get the best card recommendation or view a full analysis.",
  },
  {
    number: 6,
    title: "View Recommendation Graphs",
    description:
      "Every recommendation you make is recorded. Check out the recommendation graphs on your dashboard to see the amounts and time frames for each recommendation.",
  },
  {
    number: 7,
    title: "Try Our Free Playground",
    description:
      "Not sure how it all works? Play around in our free playground where you can experiment with different transactions and see recommendations in action.",
  },
];

export default function HowItWorks() {
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-advance the slideshow every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % stepsData.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Handlers for manual navigation
  function handleNext() {
    setCurrentStep((prev) => (prev + 1) % stepsData.length);
  }

  function handlePrev() {
    setCurrentStep((prev) => (prev - 1 + stepsData.length) % stepsData.length);
  }

  function goToStep(index) {
    setCurrentStep(index);
  }

  const step = stepsData[currentStep];

  return (
    <section className="relative overflow-hidden py-16 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700">
      {/* Decorative radial gradient behind content */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-25">
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="radialGradient" cx="0.5" cy="0.5" r="0.6">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="800" fill="url(#radialGradient)" />
        </svg>
      </div>

      {/* Optional wave shape at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          className="fill-current text-white opacity-10"
        >
          <path
            fillOpacity="1"
            d="M0,256L48,234.7C96,213,192,171,288,144C384,117,480,107,576,117.3C672,128,768,160,864,154.7C960,149,1056,107,1152,112C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        {/* Title */}
        <h2 className="text-4xl sm:text-5xl font-bold text-center mb-10 text-white drop-shadow-lg">
          How to Use{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-400">
            OneBank
          </span>
        </h2>

        {/* Glass-like Card */}
        <div className="animate-fadeIn bg-white/10 backdrop-blur-md text-white rounded-xl shadow-2xl shadow-black/30 p-6 sm:p-8">
          {/* Step Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {/* Step Circle */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 text-white flex items-center justify-center font-bold">
                {step.number}
              </div>
              <h3 className="ml-3 text-xl font-semibold drop-shadow">
                {step.title}
              </h3>
            </div>
            <span className="text-sm text-gray-100 drop-shadow">
              Step {currentStep + 1} of {stepsData.length}
            </span>
          </div>

          <p className="text-gray-100 leading-relaxed drop-shadow-sm">
            {step.description}
          </p>
        </div>

        {/* Progress Dots (Clickable) */}
        <div className="flex justify-center items-center space-x-3 mt-6">
          {stepsData.map((_, index) => (
            <span
              key={index}
              onClick={() => goToStep(index)}
              className={`cursor-pointer block w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-white shadow-lg shadow-black/50 scale-125"
                  : "bg-white bg-opacity-50"
              }`}
            />
          ))}
        </div>

        {/* Manual Navigation Buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={handlePrev}
            className="bg-pink-500 hover:bg-pink-600 transition text-white px-5 py-2 rounded-full shadow"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="bg-yellow-500 hover:bg-yellow-600 transition text-white px-5 py-2 rounded-full shadow"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
